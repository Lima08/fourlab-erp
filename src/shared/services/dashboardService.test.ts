import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/shared/db/supabase'
import { fetchDashboardSnapshot } from './dashboardService'

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function mockFromResults(results: Array<{ data: unknown; error: unknown }>) {
  let call = 0
  vi.mocked(supabase.from).mockImplementation(() => {
    const result = results[call] ?? { data: [], error: null }
    call += 1
    const chain: Record<string, unknown> = {}
    const self = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === 'then') {
            return (resolve: (v: unknown) => unknown) => resolve(result)
          }
          if (!chain[prop]) {
            chain[prop] = vi.fn(() => self)
          }
          return chain[prop]
        },
      }
    )
    return { select: vi.fn(() => self) } as never
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchDashboardSnapshot', () => {
  it('monta snapshot a partir das queries paralelas', async () => {
    mockFromResults([
      {
        data: [
          {
            kind: 'receivable',
            status: 'paid',
            total_amount: 100,
            payment_date: '2026-08-10',
            due_date: '2026-08-01',
          },
        ],
        error: null,
      },
      {
        data: [
          {
            id: 'o1',
            status: 'approved',
            total_amount: 100,
            approval_date: '2026-08-10T12:00:00.000Z',
            customers: { full_name: 'Ana' },
          },
        ],
        error: null,
      },
      {
        data: [{ status: 'waiting' }, { status: 'scrap' }],
        error: null,
      },
    ])

    const snapshot = await fetchDashboardSnapshot(new Date('2026-08-15T15:00:00.000Z'))

    expect(snapshot.financial.received).toBe(100)
    expect(snapshot.salesMonthTotal).toBe(100)
    expect(snapshot.salesEvolution).toHaveLength(6)
    expect(snapshot.production.waiting).toBe(1)
    expect(snapshot.production.scrap).toBe(1)
    expect(snapshot.latestApproved[0]?.customerName).toBe('Ana')
    expect(supabase.from).toHaveBeenCalled()
  })

  it('propaga erro se qualquer query falhar', async () => {
    mockFromResults([
      { data: null, error: { message: 'boom' } },
      { data: [], error: null },
      { data: [], error: null },
    ])

    await expect(fetchDashboardSnapshot(new Date('2026-08-15T15:00:00.000Z'))).rejects.toEqual({
      message: 'boom',
    })
  })
})
