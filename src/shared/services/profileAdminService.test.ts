import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/shared/db/supabase'
import {
  buildProfileFilter,
  deleteProfile,
  fetchProfileCounts,
  fetchProfileList,
  mapProfileError,
  mapSearchToRole,
  updateProfileFields,
  updateProfileStatus,
} from './profileAdminService'

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

const profileRow = {
  id: 'user-1',
  full_name: 'Ana Silva',
  email: 'ana@example.com',
  phone: '(11) 98765-4321',
  role: 'admin' as const,
  status: 'ativo' as const,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

function mockProfilesQuery(result: { data?: unknown[]; count?: number; error?: unknown }) {
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildProfileFilter', () => {
  it('retorna vazio para filtro all', () => {
    expect(buildProfileFilter('all')).toEqual({})
  })

  it('mapeia filtro ativo para status ativo', () => {
    expect(buildProfileFilter('ativo')).toEqual({ status: 'ativo' })
  })

  it('mapeia filtro convite_pendente para status convite_pendente', () => {
    expect(buildProfileFilter('convite_pendente')).toEqual({ status: 'convite_pendente' })
  })

  it('mapeia filtro suspenso para status suspenso', () => {
    expect(buildProfileFilter('suspenso')).toEqual({ status: 'suspenso' })
  })

  it('mapeia filtro admin para role admin', () => {
    expect(buildProfileFilter('admin')).toEqual({ role: 'admin' })
  })
})

describe('mapSearchToRole', () => {
  it('retorna null para busca vazia', () => {
    expect(mapSearchToRole('')).toBeNull()
    expect(mapSearchToRole('   ')).toBeNull()
  })

  it('mapeia administrador para admin', () => {
    expect(mapSearchToRole('administrador')).toBe('admin')
    expect(mapSearchToRole('Administrador')).toBe('admin')
  })

  it('mapeia admin para admin', () => {
    expect(mapSearchToRole('admin')).toBe('admin')
  })

  it('mapeia cliente para cliente', () => {
    expect(mapSearchToRole('cliente')).toBe('cliente')
    expect(mapSearchToRole('Cliente')).toBe('cliente')
  })

  it('retorna null para termos sem correspondência de role', () => {
    expect(mapSearchToRole('Ana Silva')).toBeNull()
  })
})

describe('fetchProfileCounts', () => {
  it('retorna contagens tipadas a partir do RPC', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        all: 10,
        ativo: 6,
        convite_pendente: 2,
        suspenso: 1,
        admin: 3,
      },
      error: null,
    } as never)

    await expect(fetchProfileCounts()).resolves.toEqual({
      all: 10,
      ativo: 6,
      convite_pendente: 2,
      suspenso: 1,
      admin: 3,
    })
  })

  it('propaga erro do RPC', async () => {
    const rpcError = { message: 'rpc failed' }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: rpcError } as never)

    await expect(fetchProfileCounts()).rejects.toEqual(rpcError)
  })
})

describe('fetchProfileList', () => {
  it('retorna profiles mapeados com paginação', async () => {
    mockProfilesQuery({ data: [profileRow], count: 11 })

    const result = await fetchProfileList({
      filter: 'all',
      search: '',
      page: 1,
      pageSize: 10,
    })

    expect(result.profiles).toHaveLength(1)
    expect(result.profiles[0]).toMatchObject({
      id: 'user-1',
      fullName: 'Ana Silva',
      email: 'ana@example.com',
    })
    expect(result.total).toBe(11)
    expect(result.totalPages).toBe(2)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
  })

  it('aplica filtro de status via eq', async () => {
    const chain = mockProfilesQuery({ data: [], count: 0 })

    await fetchProfileList({
      filter: 'ativo',
      search: '',
      page: 1,
      pageSize: 10,
    })

    expect(chain.eq).toHaveBeenCalledWith('status', 'ativo')
  })

  it('aplica filtro admin via eq em role', async () => {
    const chain = mockProfilesQuery({ data: [], count: 0 })

    await fetchProfileList({
      filter: 'admin',
      search: '',
      page: 1,
      pageSize: 10,
    })

    expect(chain.eq).toHaveBeenCalledWith('role', 'admin')
  })

  it('aplica busca com or ilike e role', async () => {
    const chain = mockProfilesQuery({ data: [], count: 0 })

    await fetchProfileList({
      filter: 'all',
      search: 'administrador',
      page: 1,
      pageSize: 10,
    })

    expect(chain.or).toHaveBeenCalledWith(
      'full_name.ilike.%administrador%,email.ilike.%administrador%,role.eq.admin'
    )
  })

  it('calcula range correto para página 2', async () => {
    const chain = mockProfilesQuery({ data: [], count: 15 })

    await fetchProfileList({
      filter: 'all',
      search: '',
      page: 2,
      pageSize: 10,
    })

    expect(chain.range).toHaveBeenCalledWith(10, 19)
  })

  it('propaga erro do supabase', async () => {
    const queryError = { message: 'query failed' }
    mockProfilesQuery({ error: queryError })

    await expect(
      fetchProfileList({ filter: 'all', search: '', page: 1, pageSize: 10 })
    ).rejects.toEqual(queryError)
  })
})

describe('mapProfileError', () => {
  it('mapeia assert_not_last_admin para mensagem PT-BR', () => {
    expect(
      mapProfileError({ message: 'assert_not_last_admin violation', code: 'P0001' } as never)
    ).toBe('Não é possível — este é o único administrador.')
  })

  it('retorna mensagem genérica para outros erros', () => {
    expect(mapProfileError({ message: 'other error', code: '23503' } as never)).toBe(
      'Operação falhou. Tente novamente.'
    )
  })
})

describe('mutations', () => {
  it('updateProfileStatus atualiza status via supabase', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ update } as never)

    await updateProfileStatus('user-1', 'suspenso')

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'suspenso', updated_at: expect.any(String) })
    )
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('updateProfileFields atualiza campos informados', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ update } as never)

    await updateProfileFields('user-1', { fullName: 'Novo Nome', phone: null })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Novo Nome',
        phone: null,
        updated_at: expect.any(String),
      })
    )
  })

  it('deleteProfile remove registro via supabase', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as never)

    await deleteProfile('user-1')

    expect(del).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
  })
})
