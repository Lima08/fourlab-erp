import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/shared/db/supabase'
import {
  computeSaleTotals,
  listSales,
  getSaleTotals,
  mapSaleListItem,
  type SaleOrderRow,
} from './saleService'

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const baseOrder: SaleOrderRow = {
  id: 'order-1',
  sale_kind: 'direct',
  status: 'approved',
  total_amount: 1000,
  issue_date: '2026-08-10T12:00:00Z',
  description: 'Peça X',
  customers: {
    id: 'cust-1',
    full_name: 'Ana Silva',
    email: 'ana@example.com',
  },
  financial_titles: [
    {
      id: 'title-1',
      total_amount: 400,
      due_date: '2026-08-01',
      payment_date: '2026-08-02',
      status: 'paid',
    },
    {
      id: 'title-2',
      total_amount: 300,
      due_date: '2026-08-20',
      payment_date: null,
      status: 'pending',
    },
    {
      id: 'title-3',
      total_amount: 300,
      due_date: '2026-07-01',
      payment_date: null,
      status: 'pending',
    },
  ],
}

function mockSalesQuery(result: { data?: unknown[]; count?: number; error?: unknown }) {
  const resolved = {
    data: result.data ?? [],
    count: result.count ?? (result.data?.length ?? 0),
    error: result.error ?? null,
  }

  const range = vi.fn().mockResolvedValue(resolved)
  const order = vi.fn().mockReturnValue({ range, then: undefined })
  // totals path ends at order() without range — make order thenable when awaited
  const orderThenable = Object.assign(order, {
    mockImplementation: order.mockImplementation.bind(order),
  })

  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  const self = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === 'range') return range
        if (prop === 'order') {
          return vi.fn(() => ({
            range,
            // allow await query.order() for totals
            then: (resolve: (v: unknown) => unknown) => resolve(resolved),
          }))
        }
        if (!chain[prop]) {
          chain[prop] = vi.fn(() => self)
        }
        return chain[prop]
      },
    }
  )

  const select = vi.fn().mockReturnValue(self)
  vi.mocked(supabase.from).mockReturnValue({ select } as never)

  return { select, range, order: orderThenable, chain }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('mapSaleListItem', () => {
  it('mapeia pedido aninhado para SaleListItem com resumo de pagamento', () => {
    const item = mapSaleListItem(baseOrder, '2026-08-15')

    expect(item).toMatchObject({
      id: 'order-1',
      saleKind: 'direct',
      status: 'approved',
      totalAmount: 1000,
      description: 'Peça X',
      customer: {
        id: 'cust-1',
        fullName: 'Ana Silva',
        email: 'ana@example.com',
      },
      paymentSummary: {
        hasTitle: true,
        paidAmount: 400,
        openAmount: 300,
        overdueAmount: 300,
        nextDueDate: '2026-07-01',
      },
    })
  })

  it('orçamento sem título fica com resumo zerado', () => {
    const quote: SaleOrderRow = {
      ...baseOrder,
      id: 'order-q',
      sale_kind: 'quote',
      status: 'quote',
      financial_titles: [],
    }

    const item = mapSaleListItem(quote, '2026-08-15')

    expect(item.paymentSummary).toEqual({
      hasTitle: false,
      paidAmount: 0,
      openAmount: 0,
      overdueAmount: 0,
      nextDueDate: null,
    })
  })
})

describe('computeSaleTotals', () => {
  it('soma vendas aprovadas e classifica parcelas do mesmo recorte', () => {
    const quote: SaleOrderRow = {
      ...baseOrder,
      id: 'order-q',
      status: 'quote',
      sale_kind: 'quote',
      total_amount: 500,
      financial_titles: [],
    }

    const totals = computeSaleTotals([baseOrder, quote], '2026-08-15')

    expect(totals).toEqual({
      totalSales: 1000,
      totalPaid: 400,
      totalPayable: 300,
      totalOverdue: 300,
    })
  })

  it('ignora pedidos cancelados em totalSales', () => {
    const canceled: SaleOrderRow = {
      ...baseOrder,
      id: 'order-c',
      status: 'canceled',
      total_amount: 999,
      financial_titles: [],
    }

    expect(computeSaleTotals([canceled], '2026-08-15').totalSales).toBe(0)
  })
})

describe('listSales', () => {
  it('retorna vendas mapeadas com total de paginação', async () => {
    mockSalesQuery({ data: [baseOrder], count: 1 })

    const result = await listSales({
      page: 1,
      pageSize: 20,
      periodFrom: '2026-08-01',
      periodTo: '2026-08-31',
      search: '',
      includeCanceled: false,
      today: '2026-08-15',
    })

    expect(supabase.from).toHaveBeenCalledWith('orders')
    expect(result.total).toBe(1)
    expect(result.rows[0]?.customer.fullName).toBe('Ana Silva')
    expect(result.rows[0]?.paymentSummary.paidAmount).toBe(400)
  })
})

describe('getSaleTotals', () => {
  it('agrega todos os pedidos do recorte sem depender da página', async () => {
    mockSalesQuery({ data: [baseOrder], count: 1 })

    const totals = await getSaleTotals({
      periodFrom: '2026-08-01',
      periodTo: '2026-08-31',
      search: '',
      includeCanceled: false,
      today: '2026-08-15',
    })

    expect(totals.totalSales).toBe(1000)
    expect(totals.totalPaid).toBe(400)
    expect(totals.totalPayable).toBe(300)
    expect(totals.totalOverdue).toBe(300)
  })
})
