import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/shared/db/supabase'
import {
  buildCustomerSearchOrFilter,
  createCustomer,
  CustomerError,
  escapeIlikePattern,
  getCustomer,
  getCustomerStatusCounts,
  listCustomerOrders,
  listCustomers,
  setCustomerActive,
  updateCustomer,
} from './customerService'

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const customerRow = {
  id: 'cust-1',
  customer_type: 'pf' as const,
  document: '52998224725',
  full_name: 'Ana Silva',
  trade_name: null,
  email: 'ana@example.com',
  phone: '11987654321',
  zip_code: '01310100',
  street: 'Av. Paulista',
  number: '1000',
  complement: null,
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  instagram: null,
  facebook: null,
  linkedin: null,
  website: null,
  notes: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

function mockListQuery(result: { data?: unknown[]; count?: number; error?: unknown }) {
  const range = vi.fn().mockResolvedValue({
    data: result.data ?? [],
    count: result.count ?? 0,
    error: result.error ?? null,
  })
  const order = vi.fn().mockReturnValue({ range })
  const or = vi.fn().mockReturnValue({ order })
  const chain = { eq: vi.fn(), or, order }
  chain.eq.mockReturnValue(chain)
  const select = vi.fn().mockReturnValue(chain)

  vi.mocked(supabase.from).mockReturnValue({ select } as never)

  return { select, eq: chain.eq, or, order, range }
}

function mockSingleQuery(result: { data?: unknown; error?: unknown }) {
  const resolved = {
    data: result.data ?? null,
    error: result.error ?? null,
  }
  const maybeSingle = vi.fn().mockResolvedValue(resolved)
  const single = vi.fn().mockResolvedValue(resolved)
  const eq = vi.fn().mockReturnValue({ maybeSingle, single })
  const select = vi.fn().mockReturnValue({ eq, single, maybeSingle })
  const insert = vi.fn().mockReturnValue({ select })
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select }) })

  vi.mocked(supabase.from).mockReturnValue({ select, insert, update } as never)

  return { select, insert, update, eq, single, maybeSingle }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('escapeIlikePattern', () => {
  it('escapa caracteres especiais de ilike', () => {
    expect(escapeIlikePattern('100%_test')).toBe('100\\%\\_test')
  })
})

describe('listCustomers', () => {
  it('retorna clientes mapeados com paginação', async () => {
    mockListQuery({ data: [customerRow], count: 21 })

    const result = await listCustomers({ page: 1, status: 'active', search: '' })

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      id: 'cust-1',
      fullName: 'Ana Silva',
      customerType: 'pf',
      isActive: true,
    })
    expect(result.total).toBe(21)
  })

  it('aplica filtro de busca com escape e valores entre aspas', async () => {
    const query = mockListQuery({ data: [], count: 0 })

    await listCustomers({ page: 1, status: 'all', search: '100%' })

    expect(query.or).toHaveBeenCalledWith(buildCustomerSearchOrFilter('100%'))
    expect(query.or.mock.calls[0]?.[0]).toContain('full_name.ilike."%100\\%%"')
  })

  it('protege vírgulas no termo de busca dentro do filtro or', async () => {
    const query = mockListQuery({ data: [], count: 0 })

    await listCustomers({ page: 1, status: 'all', search: 'Hexagon, Inc' })

    const filter = query.or.mock.calls[0]?.[0] as string
    expect(filter).toContain('full_name.ilike."%Hexagon, Inc%"')
    expect(filter.split('ilike.').length).toBeGreaterThan(2)
  })

  it('busca telefone também pelos dígitos quando há máscara', async () => {
    const query = mockListQuery({ data: [], count: 0 })

    await listCustomers({ page: 1, status: 'all', search: '(11) 98765-4321' })

    const filter = query.or.mock.calls[0]?.[0] as string
    expect(filter).toContain('phone.ilike."%11987654321%"')
  })
})

describe('buildCustomerSearchOrFilter', () => {
  it('inclui cláusula de telefone só com dígitos quando há máscara', () => {
    const filter = buildCustomerSearchOrFilter('(11) 98888-7777')
    expect(filter).toContain('phone.ilike."%(11) 98888-7777%"')
    expect(filter).toContain('phone.ilike."%11988887777%"')
  })
})

describe('getCustomerStatusCounts', () => {
  it('conta ativos, inativos e todos em paralelo', async () => {
    const responses = [
      { count: 3, error: null },
      { count: 1, error: null },
      { count: 4, error: null },
    ]
    let call = 0

    const select = vi.fn().mockImplementation(() => {
      const result = responses[call++] ?? { count: 0, error: null }
      const builder = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        then: (
          resolve: (value: { count: number; error: null }) => unknown,
          reject?: (reason: unknown) => unknown
        ) => Promise.resolve(result).then(resolve, reject),
      }
      return builder
    })

    vi.mocked(supabase.from).mockReturnValue({ select } as never)

    const counts = await getCustomerStatusCounts('')

    expect(counts).toEqual({ active: 3, inactive: 1, all: 4 })
    expect(select).toHaveBeenCalledTimes(3)
  })
})

describe('getCustomer', () => {
  it('retorna null quando cliente não existe', async () => {
    mockSingleQuery({ data: null, error: null })

    await expect(getCustomer('missing')).resolves.toBeNull()
  })
})

describe('createCustomer', () => {
  it('grava documento somente com dígitos', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: customerRow, error: null }),
      }),
    })
    vi.mocked(supabase.from).mockReturnValue({ insert } as never)

    await createCustomer({
      customerType: 'pf',
      fullName: 'Ana Silva',
      document: '529.982.247-25',
    })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        document: '52998224725',
        full_name: 'Ana Silva',
      })
    )
  })

  it('mapeia violação de unique para DOCUMENT_CONFLICT', async () => {
    const insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key value' },
        }),
      }),
    })
    vi.mocked(supabase.from).mockReturnValue({ insert } as never)

    await expect(
      createCustomer({ customerType: 'pf', fullName: 'Ana Silva', document: '52998224725' })
    ).rejects.toMatchObject({
      code: 'DOCUMENT_CONFLICT',
    })
  })
})

describe('updateCustomer', () => {
  it('propaga DOCUMENT_CONFLICT em update', async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '23505', message: 'duplicate key value' },
          }),
        }),
      }),
    })
    vi.mocked(supabase.from).mockReturnValue({ update } as never)

    await expect(
      updateCustomer('cust-1', { customerType: 'pf', fullName: 'Ana Silva' })
    ).rejects.toBeInstanceOf(CustomerError)
  })
})

describe('setCustomerActive', () => {
  it('atualiza status ativo', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ update } as never)

    await setCustomerActive('cust-1', false)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false })
    )
  })
})

describe('listCustomerOrders', () => {
  it('retorna resumo de pedidos mapeado', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'order-1',
          status: 'approved',
          total_amount: 1500,
          issue_date: '2026-02-01',
        },
      ],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ select } as never)

    const result = await listCustomerOrders('cust-1')

    expect(result).toEqual([
      {
        id: 'order-1',
        status: 'approved',
        totalAmount: 1500,
        issueDate: '2026-02-01',
      },
    ])
  })
})
