import {
  getBrazilTodayIso,
  type BrazilMonthBounds,
  type BrazilMonthBucket,
} from '@/shared/utils/brazilCalendarMonth'
import type { Database } from '@/shared/db/database.types'

export type FinancialTitleKind = Database['public']['Enums']['financial_title_kind']
export type FinancialTitleStatus = Database['public']['Enums']['financial_title_status']
export type OrderStatus = Database['public']['Enums']['order_status']
export type ProductionStatus = Database['public']['Enums']['production_status']

export interface FinancialTitleRow {
  kind: FinancialTitleKind
  status: FinancialTitleStatus
  total_amount: number
  payment_date: string | null
  due_date: string
}

export interface OrderSalesRow {
  id: string
  status: OrderStatus
  total_amount: number
  approval_date: string | null
  customer_name: string
}

export interface ProductionStatusRow {
  status: ProductionStatus
}

export interface MoneyPulse {
  received: number
  paid: number
  balance: number
  overdueCount: number
  overdueAmount: number
}

export interface MonthBucket {
  monthKey: string
  label: string
  total: number
}

export interface ProductionFunnelCounts {
  waiting: number
  inProduction: number
  assembly: number
  completed: number
  scrap: number
}

export interface LatestApprovedItem {
  id: string
  customerName: string
  totalAmount: number
  approvalDate: string
  status: Exclude<OrderStatus, 'quote' | 'canceled'>
}

const SALES_STATUSES = new Set<OrderStatus>([
  'approved',
  'in_production',
  'completed',
  'delivered',
])

function inInclusiveRange(isoDate: string, start: string, end: string): boolean {
  return isoDate >= start && isoDate <= end
}

function approvalMonthKey(approvalDate: string): string {
  const iso = getBrazilTodayIso(new Date(approvalDate))
  return iso.slice(0, 7)
}

export function buildFinancialPulse(
  titles: FinancialTitleRow[],
  month: BrazilMonthBounds,
  todayIso: string
): MoneyPulse {
  let received = 0
  let paid = 0
  let overdueCount = 0
  let overdueAmount = 0

  for (const title of titles) {
    if (title.status === 'paid' && title.payment_date) {
      if (inInclusiveRange(title.payment_date, month.start, month.end)) {
        if (title.kind === 'receivable') received += Number(title.total_amount)
        if (title.kind === 'payable') paid += Number(title.total_amount)
      }
    }

    if (title.status === 'canceled') continue

    const isOverdue =
      title.status === 'overdue' || (title.status === 'pending' && title.due_date < todayIso)

    if (isOverdue) {
      overdueCount += 1
      overdueAmount += Number(title.total_amount)
    }
  }

  return {
    received,
    paid,
    balance: received - paid,
    overdueCount,
    overdueAmount,
  }
}

export function buildSalesEvolution(
  orders: OrderSalesRow[],
  months: BrazilMonthBucket[],
  currentMonth: BrazilMonthBounds
): { monthTotal: number; evolution: MonthBucket[] } {
  const totals = new Map<string, number>(months.map((m) => [m.monthKey, 0]))

  for (const order of orders) {
    if (!SALES_STATUSES.has(order.status) || !order.approval_date) continue
    const key = approvalMonthKey(order.approval_date)
    if (!totals.has(key)) continue
    totals.set(key, (totals.get(key) ?? 0) + Number(order.total_amount))
  }

  const evolution = months.map((m) => ({
    monthKey: m.monthKey,
    label: m.label,
    total: totals.get(m.monthKey) ?? 0,
  }))

  const monthTotal = evolution.find((b) => b.monthKey === currentMonth.monthKey)?.total ?? 0

  return { monthTotal, evolution }
}

export function buildProductionFunnel(rows: ProductionStatusRow[]): ProductionFunnelCounts {
  const counts: ProductionFunnelCounts = {
    waiting: 0,
    inProduction: 0,
    assembly: 0,
    completed: 0,
    scrap: 0,
  }

  for (const row of rows) {
    switch (row.status) {
      case 'waiting':
        counts.waiting += 1
        break
      case 'in_production':
        counts.inProduction += 1
        break
      case 'assembly':
        counts.assembly += 1
        break
      case 'completed':
        counts.completed += 1
        break
      case 'scrap':
        counts.scrap += 1
        break
    }
  }

  return counts
}

export function buildLatestApproved(orders: OrderSalesRow[], limit = 8): LatestApprovedItem[] {
  return orders
    .filter(
      (o): o is OrderSalesRow & { approval_date: string; status: LatestApprovedItem['status'] } =>
        SALES_STATUSES.has(o.status) && o.approval_date != null && o.status !== 'quote' && o.status !== 'canceled'
    )
    .sort((a, b) => (a.approval_date < b.approval_date ? 1 : a.approval_date > b.approval_date ? -1 : 0))
    .slice(0, limit)
    .map((o) => ({
      id: o.id,
      customerName: o.customer_name,
      totalAmount: Number(o.total_amount),
      approvalDate: o.approval_date,
      status: o.status,
    }))
}
