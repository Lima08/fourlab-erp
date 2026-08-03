import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/shared/db/supabase'
import {
  buildProfileFilter,
  deleteProfile,
  fetchProfileCounts,
  fetchProfileList,
  mapProfileError,
  updateProfileActiveStatus,
  updateProfileFields,
} from './profileAdminService'

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

const profileRow = {
  id: 'user-1',
  full_name: 'Ana Silva',
  email: 'ana@example.com',
  phone: '(11) 98765-4321',
  is_active: true,
  activated_at: '2026-01-01T00:00:00Z',
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

function mockCountQuery(count: number, error: unknown = null) {
  const eq = vi.fn().mockResolvedValue({ count, error })
  const select = vi.fn().mockReturnValue({ eq })
  return { select, eq }
}

function mockHeadCountQuery(count: number, error: unknown = null) {
  const select = vi.fn().mockResolvedValue({ count, error })
  return { select }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildProfileFilter', () => {
  it('retorna vazio para filtro all', () => {
    expect(buildProfileFilter('all')).toEqual({})
  })

  it('mapeia filtro active para isActive true', () => {
    expect(buildProfileFilter('active')).toEqual({ isActive: true })
  })

  it('mapeia filtro inactive para isActive false', () => {
    expect(buildProfileFilter('inactive')).toEqual({ isActive: false })
  })
})

describe('fetchProfileCounts', () => {
  it('retorna contagens tipadas a partir de queries diretas', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockHeadCountQuery(10) as never)
      .mockReturnValueOnce(mockCountQuery(7) as never)
      .mockReturnValueOnce(mockCountQuery(3) as never)

    await expect(fetchProfileCounts()).resolves.toEqual({
      all: 10,
      active: 7,
      inactive: 3,
    })
  })

  it('propaga erro da query', async () => {
    const queryError = { message: 'query failed' }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockHeadCountQuery(0, queryError) as never)
      .mockReturnValueOnce(mockCountQuery(7) as never)
      .mockReturnValueOnce(mockCountQuery(3) as never)

    await expect(fetchProfileCounts()).rejects.toEqual(queryError)
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
      isActive: true,
    })
    expect(result.total).toBe(11)
    expect(result.totalPages).toBe(2)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
  })

  it('aplica filtro active via eq em is_active', async () => {
    const chain = mockProfilesQuery({ data: [], count: 0 })

    await fetchProfileList({
      filter: 'active',
      search: '',
      page: 1,
      pageSize: 10,
    })

    expect(chain.eq).toHaveBeenCalledWith('is_active', true)
  })

  it('aplica busca com or ilike em nome e e-mail', async () => {
    const chain = mockProfilesQuery({ data: [], count: 0 })

    await fetchProfileList({
      filter: 'all',
      search: 'Ana Silva',
      page: 1,
      pageSize: 10,
    })

    expect(chain.or).toHaveBeenCalledWith('full_name.ilike.%Ana Silva%,email.ilike.%Ana Silva%')
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
  it('retorna mensagem genérica para erros', () => {
    expect(mapProfileError({ message: 'other error', code: '23503' } as never)).toBe(
      'Operação falhou. Tente novamente.'
    )
  })
})

describe('mutations', () => {
  it('updateProfileActiveStatus atualiza is_active via supabase', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    vi.mocked(supabase.from).mockReturnValue({ update } as never)

    await updateProfileActiveStatus('user-1', false)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false, updated_at: expect.any(String) })
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
