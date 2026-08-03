import { supabase } from '@/shared/db/supabase'
import { escapeIlikePattern } from '@/shared/services/customerService'
import type { Database } from '@/shared/db/database.types'

type OrderStatus = Database['public']['Enums']['order_status']
type SaleKind = Database['public']['Enums']['sale_kind']
type InstallmentStatus = Database['public']['Enums']['financial_installment_status']

/** Mirrors app/sales/utils/installmentStatus — kept here to avoid shared → app imports. */
function getEffectiveInstallmentStatus(
  status: InstallmentStatus,
  dueDate: string,
  today: string
): InstallmentStatus | 'overdue' {
  if (status === 'pending' && dueDate < today) return 'overdue'
  return status
}

/** Mirrors app/sales/utils/money.parseSearchAmount for list filters. */
function parseSearchAmount(term: string): number | null {
  const trimmed = term.trim()
  if (!trimmed) return null

  let normalized = trimmed.replace(/R\$\s?/gi, '').replace(/\s/g, '')

  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (normalized.includes(',') && !normalized.includes('.')) {
    normalized = normalized.replace(',', '.')
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

export interface SaleListItem {
  id: string
  saleKind: SaleKind
  status: OrderStatus
  totalAmount: number
  issueDate: string
  description: string | null
  customer: { id: string; fullName: string; email: string | null }
  paymentSummary: {
    hasTitle: boolean
    paidAmount: number
    openAmount: number
    overdueAmount: number
    nextDueDate: string | null
  }
}

export interface SaleTotals {
  totalSales: number
  totalPaid: number
  totalPayable: number
  totalOverdue: number
}

export interface ListSalesParams {
  page: number
  pageSize?: number
  periodFrom: string
  periodTo: string
  search: string
  includeCanceled: boolean
  /** ISO date YYYY-MM-DD for overdue derivation */
  today?: string
}

export interface SaleTotalsParams {
  periodFrom: string
  periodTo: string
  search: string
  includeCanceled: boolean
  today?: string
}

export interface ListSalesResult {
  rows: SaleListItem[]
  total: number
}

export interface SaleInstallmentRow {
  id: string
  amount: number
  due_date: string
  payment_date: string | null
  status: InstallmentStatus
}

export interface SaleOrderRow {
  id: string
  sale_kind: SaleKind
  status: OrderStatus
  total_amount: number
  issue_date: string
  description: string | null
  customers: { id: string; full_name: string; email: string | null } | null
  financial_titles:
    | Array<{
        id: string
        financial_installments: SaleInstallmentRow[] | null
      }>
    | null
}

const DEFAULT_PAGE_SIZE = 20

const SALE_SELECT = `
  id,
  sale_kind,
  status,
  total_amount,
  issue_date,
  description,
  customers!inner (
    id,
    full_name,
    email
  ),
  financial_titles (
    id,
    financial_installments (
      id,
      amount,
      due_date,
      payment_date,
      status
    )
  )
`

function todayIso(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function endOfDayIso(date: string): string {
  return `${date}T23:59:59.999Z`
}

function startOfDayIso(date: string): string {
  return `${date}T00:00:00.000Z`
}

function collectInstallments(row: SaleOrderRow): SaleInstallmentRow[] {
  return (row.financial_titles ?? []).flatMap((title) => title.financial_installments ?? [])
}

export function mapSaleListItem(row: SaleOrderRow, today: string): SaleListItem {
  const installments = collectInstallments(row)
  let paidAmount = 0
  let openAmount = 0
  let overdueAmount = 0
  let nextDueDate: string | null = null

  for (const inst of installments) {
    const effective = getEffectiveInstallmentStatus(inst.status, inst.due_date, today)
    if (effective === 'paid') {
      paidAmount += Number(inst.amount)
      continue
    }
    if (effective === 'canceled') continue

    if (effective === 'overdue') {
      overdueAmount += Number(inst.amount)
    } else {
      openAmount += Number(inst.amount)
    }

    if (nextDueDate === null || inst.due_date < nextDueDate) {
      nextDueDate = inst.due_date
    }
  }

  const customer = row.customers

  return {
    id: row.id,
    saleKind: row.sale_kind,
    status: row.status,
    totalAmount: Number(row.total_amount),
    issueDate: row.issue_date,
    description: row.description,
    customer: {
      id: customer?.id ?? '',
      fullName: customer?.full_name ?? '',
      email: customer?.email ?? null,
    },
    paymentSummary: {
      hasTitle: (row.financial_titles?.length ?? 0) > 0,
      paidAmount,
      openAmount,
      overdueAmount,
      nextDueDate,
    },
  }
}

export function computeSaleTotals(rows: SaleOrderRow[], today: string): SaleTotals {
  let totalSales = 0
  let totalPaid = 0
  let totalPayable = 0
  let totalOverdue = 0

  for (const row of rows) {
    if (row.status !== 'quote' && row.status !== 'canceled') {
      totalSales += Number(row.total_amount)
    }

    for (const inst of collectInstallments(row)) {
      const effective = getEffectiveInstallmentStatus(inst.status, inst.due_date, today)
      const amount = Number(inst.amount)
      if (effective === 'paid') totalPaid += amount
      else if (effective === 'overdue') totalOverdue += amount
      else if (effective === 'pending') totalPayable += amount
    }
  }

  return { totalSales, totalPaid, totalPayable, totalOverdue }
}

type SaleFilterParams = {
  periodFrom: string
  periodTo: string
  search: string
  includeCanceled: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST filter chain
function applySaleFilters(query: any, params: SaleFilterParams) {
  let next = query
    .gte('issue_date', startOfDayIso(params.periodFrom))
    .lte('issue_date', endOfDayIso(params.periodTo))

  if (!params.includeCanceled) {
    next = next.neq('status', 'canceled')
  }

  const trimmed = params.search.trim()
  if (!trimmed) return next

  const amount = parseSearchAmount(trimmed)
  const escaped = escapeIlikePattern(trimmed)
  const pattern = `%${escaped}%`

  if (amount !== null) {
    return next.or(
      `total_amount.eq.${amount},customers.full_name.ilike.${pattern},customers.email.ilike.${pattern}`
    )
  }

  return next.or(`customers.full_name.ilike.${pattern},customers.email.ilike.${pattern}`)
}

export async function listSales(params: ListSalesParams): Promise<ListSalesResult> {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  const from = (params.page - 1) * pageSize
  const to = from + pageSize - 1
  const today = params.today ?? todayIso()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST filter chain
  let query: any = supabase.from('orders').select(SALE_SELECT, { count: 'exact' })
  query = applySaleFilters(query, params)

  const { data, error, count } = await query
    .order('issue_date', { ascending: false })
    .range(from, to)

  if (error) throw error

  const rows = ((data ?? []) as SaleOrderRow[]).map((row) => mapSaleListItem(row, today))

  return { rows, total: count ?? 0 }
}

export async function getSaleTotals(params: SaleTotalsParams): Promise<SaleTotals> {
  const today = params.today ?? todayIso()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST filter chain
  let query: any = supabase.from('orders').select(SALE_SELECT)
  query = applySaleFilters(query, params)

  const { data, error } = await query.order('issue_date', { ascending: false })

  if (error) throw error

  return computeSaleTotals((data ?? []) as SaleOrderRow[], today)
}
