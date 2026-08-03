import { supabase } from '@/shared/db/supabase'
import {
  getBrazilMonthBounds,
  getBrazilTodayIso,
  listBrazilMonths,
} from '@/shared/utils/brazilCalendarMonth'
import {
  buildFinancialPulse,
  buildLatestApproved,
  buildProductionFunnel,
  buildSalesEvolution,
  type FinancialTitleRow,
  type MoneyPulse,
  type MonthBucket,
  type LatestApprovedItem,
  type OrderSalesRow,
  type ProductionFunnelCounts,
} from '@/app/dashboard/utils/dashboardAggregates'

export interface DashboardSnapshot {
  monthKey: string
  monthLabel: string
  financial: MoneyPulse
  salesMonthTotal: number
  salesEvolution: MonthBucket[]
  production: ProductionFunnelCounts
  latestApproved: LatestApprovedItem[]
}

interface OrderQueryRow {
  id: string
  status: OrderSalesRow['status']
  total_amount: number
  approval_date: string | null
  customers: { full_name: string } | null
}

function mapOrders(rows: OrderQueryRow[] | null): OrderSalesRow[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    total_amount: Number(row.total_amount),
    approval_date: row.approval_date,
    customer_name: row.customers?.full_name ?? 'Cliente',
  }))
}

export async function fetchDashboardSnapshot(
  referenceDate: Date = new Date()
): Promise<DashboardSnapshot> {
  const month = getBrazilMonthBounds(referenceDate)
  const months = listBrazilMonths(6, referenceDate)
  const today = getBrazilTodayIso(referenceDate)
  const evolutionStart = months[0]?.start ?? month.start

  const titlesQuery = supabase
    .from('financial_titles')
    .select('kind, status, total_amount, payment_date, due_date')
    .neq('status', 'canceled')

  const ordersQuery = supabase
    .from('orders')
    .select('id, status, total_amount, approval_date, customers(full_name)')
    .in('status', ['approved', 'in_production', 'completed', 'delivered'])
    .not('approval_date', 'is', null)
    .gte('approval_date', `${evolutionStart}T00:00:00.000Z`)

  const productionQuery = supabase.from('production_orders').select('status')

  const [titlesRes, ordersRes, productionRes] = await Promise.all([
    titlesQuery,
    ordersQuery,
    productionQuery,
  ])

  if (titlesRes.error) throw titlesRes.error
  if (ordersRes.error) throw ordersRes.error
  if (productionRes.error) throw productionRes.error

  const titles = (titlesRes.data ?? []) as FinancialTitleRow[]
  const orders = mapOrders(ordersRes.data as OrderQueryRow[] | null)

  const financial = buildFinancialPulse(titles, month, today)
  const { monthTotal, evolution } = buildSalesEvolution(orders, months, month)
  const production = buildProductionFunnel(productionRes.data ?? [])
  const latestApproved = buildLatestApproved(orders, 8)

  return {
    monthKey: month.monthKey,
    monthLabel: months.find((m) => m.monthKey === month.monthKey)?.label ?? month.monthKey,
    financial,
    salesMonthTotal: monthTotal,
    salesEvolution: evolution,
    production,
    latestApproved,
  }
}
