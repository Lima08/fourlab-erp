import { describe, expect, it } from 'vitest'
import {
  buildFinancialPulse,
  buildLatestApproved,
  buildProductionFunnel,
  buildSalesEvolution,
  type FinancialTitleRow,
  type OrderSalesRow,
  type ProductionStatusRow,
} from './dashboardAggregates'
import { listBrazilMonths } from '@/shared/utils/brazilCalendarMonth'

const monthBuckets = listBrazilMonths(6, new Date('2026-08-15T15:00:00.000Z'))
const today = '2026-08-15'
const monthBounds = { start: '2026-08-01', end: '2026-08-31', monthKey: '2026-08' }

describe('buildFinancialPulse', () => {
  it('soma recebido/pago do mês e calcula saldo', () => {
    const titles: FinancialTitleRow[] = [
      {
        kind: 'receivable',
        status: 'paid',
        total_amount: 100,
        payment_date: '2026-08-10',
        due_date: '2026-08-01',
      },
      {
        kind: 'payable',
        status: 'paid',
        total_amount: 40,
        payment_date: '2026-08-12',
        due_date: '2026-08-05',
      },
      {
        kind: 'receivable',
        status: 'paid',
        total_amount: 50,
        payment_date: '2026-07-01',
        due_date: '2026-07-01',
      },
    ]

    const pulse = buildFinancialPulse(titles, monthBounds, today)
    expect(pulse).toEqual({
      received: 100,
      paid: 40,
      balance: 60,
      overdueCount: 0,
      overdueAmount: 0,
    })
  })

  it('conta atrasados por status overdue ou pending com due_date < hoje', () => {
    const titles: FinancialTitleRow[] = [
      {
        kind: 'receivable',
        status: 'pending',
        total_amount: 20,
        payment_date: null,
        due_date: '2026-08-01',
      },
      {
        kind: 'payable',
        status: 'overdue',
        total_amount: 30,
        payment_date: null,
        due_date: '2026-07-01',
      },
      {
        kind: 'receivable',
        status: 'pending',
        total_amount: 10,
        payment_date: null,
        due_date: '2026-08-15',
      },
      {
        kind: 'receivable',
        status: 'canceled',
        total_amount: 99,
        payment_date: null,
        due_date: '2026-07-01',
      },
    ]

    const pulse = buildFinancialPulse(titles, monthBounds, today)
    expect(pulse.overdueCount).toBe(2)
    expect(pulse.overdueAmount).toBe(50)
  })
})

describe('buildSalesEvolution', () => {
  it('agrega vendas approved+ por approval_date nos 6 meses', () => {
    const orders: OrderSalesRow[] = [
      {
        id: '1',
        status: 'approved',
        total_amount: 100,
        approval_date: '2026-08-10T12:00:00.000Z',
        customer_name: 'A',
      },
      {
        id: '2',
        status: 'delivered',
        total_amount: 50,
        approval_date: '2026-06-01T12:00:00.000Z',
        customer_name: 'B',
      },
      {
        id: '3',
        status: 'quote',
        total_amount: 999,
        approval_date: '2026-08-01T12:00:00.000Z',
        customer_name: 'C',
      },
      {
        id: '4',
        status: 'approved',
        total_amount: 10,
        approval_date: null,
        customer_name: 'D',
      },
    ]

    const { monthTotal, evolution } = buildSalesEvolution(orders, monthBuckets, monthBounds)
    expect(monthTotal).toBe(100)
    expect(evolution).toHaveLength(6)
    expect(evolution.find((b) => b.monthKey === '2026-08')?.total).toBe(100)
    expect(evolution.find((b) => b.monthKey === '2026-06')?.total).toBe(50)
    expect(evolution.find((b) => b.monthKey === '2026-07')?.total).toBe(0)
  })
})

describe('buildProductionFunnel', () => {
  it('conta statuses e isola scrap', () => {
    const rows: ProductionStatusRow[] = [
      { status: 'waiting' },
      { status: 'waiting' },
      { status: 'in_production' },
      { status: 'assembly' },
      { status: 'completed' },
      { status: 'scrap' },
      { status: 'scrap' },
    ]

    expect(buildProductionFunnel(rows)).toEqual({
      waiting: 2,
      inProduction: 1,
      assembly: 1,
      completed: 1,
      scrap: 2,
    })
  })
})

describe('buildLatestApproved', () => {
  it('retorna até 8 aprovados ordenados por approval_date desc', () => {
    const orders: OrderSalesRow[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      status: 'approved' as const,
      total_amount: i,
      approval_date: `2026-08-${String(i + 1).padStart(2, '0')}T12:00:00.000Z`,
      customer_name: `C${i}`,
    }))

    const latest = buildLatestApproved(orders, 8)
    expect(latest).toHaveLength(8)
    expect(latest[0]?.id).toBe('9')
    expect(latest[0]?.customerName).toBe('C9')
    expect(latest.at(-1)?.id).toBe('2')
  })
})
