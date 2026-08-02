import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '@/shared/db/dexie'
import {
  downloadProject,
  pullUpdates,
  checkForUpdates,
  syncProjectList,
  refreshRemoteProjectMetadata,
} from '@/shared/services/sync/syncService'
import { supabase } from '@/shared/db/supabase'

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  },
}))

const makeRemoteProjectRow = (id: string) => ({
  id,
  name: 'Test Project',
  street: 'Rua A',
  number: '123',
  complement: null,
  neighborhood: 'Centro',
  city: 'SP',
  state: 'SP',
  postal_code: '01001-000',
  description: '',
  client_id: 'client-1',
  responsible_profile_id: 'admin-1',
  total_area: null,
  document_type: 'PT_APPROVED',
  document_storage_path: null,
  status: 'pending',
  download_state: 'cloud',
  completed_items: 0,
  total_items: 0,
  downloaded_at: new Date().toISOString(),
  synced_at: null,
  server_updated_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

const makeRemoteLocationRow = (id: string, projectId: string) => ({
  id,
  project_id: projectId,
  name: 'Sala 1',
  type: 'room',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

const makeRemoteItemRow = (id: string, projectId: string) => ({
  id,
  project_id: projectId,
  location_id: null,
  description: 'Item test',
  category: 'other',
  status: 'pending',
  deleted_at: null,
  deleted_by_id: null,
  updated_at: new Date().toISOString(),
  synced_at: null,
  technician_id: 'tech-1',
  conflict_status: false,
})

const makeRemoteEvidenceRow = (
  id: string,
  itemId: string,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  item_id: itemId,
  type: 'photo',
  blob_url: `p1/${itemId}/${id}`,
  comment: null,
  created_at: new Date('2026-01-01').toISOString(),
  updated_at: new Date('2026-06-01T12:00:00Z').toISOString(),
  technician_id: 'tech-1',
  ...overrides,
})

const mockStorageDownload = (blob: Blob) => {
  vi.mocked(supabase.storage.from).mockReturnValue({
    download: vi.fn().mockResolvedValue({ data: blob, error: null }),
  } as never)
}

const emptyEvidenceQueryMock = {
  select: vi.fn().mockReturnThis(),
  in: vi.fn().mockResolvedValue({ data: [], error: null }),
}

/** Chainable supabase select mock; awaitable at any step (supports .is / .gt / .in). */
function mockSelectQuery(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    gt: vi.fn(),
    in: vi.fn(),
    is: vi.fn(),
    single: vi.fn().mockResolvedValue(result),
    then: (
      onfulfilled: (value: typeof result) => unknown,
      onrejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onfulfilled, onrejected),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.gt.mockReturnValue(chain)
  chain.in.mockReturnValue(chain)
  chain.is.mockReturnValue(chain)
  return chain
}

const makeLocalProject = (id: string) => ({
  id,
  name: 'Test',
  street: '',
  number: '',
  complement: null,
  neighborhood: '',
  city: '',
  state: '',
  postalCode: '',
  description: '',
  clientId: 'c1',
  responsibleProfileId: 'admin-1',
  totalArea: null,
  documentType: 'PT_APPROVED' as const,
  documentStoragePath: null,
  status: 'pending' as const,
  downloadState: 'device' as const,
  updateState: 'update_available' as const,
  completedItems: 0,
  totalItems: 0,
  downloadedAt: new Date(),
  syncedAt: new Date('2020-01-01'),
  serverUpdatedAt: null,
})

beforeEach(async () => {
  await db.delete()
  await db.open()
  vi.clearAllMocks()
})

describe('downloadProject', () => {
  it('persiste projeto com downloadState=device quando supabase retorna dados', async () => {
    const projectRow = makeRemoteProjectRow('p1')
    const locationRow = makeRemoteLocationRow('loc-1', 'p1')
    const itemRow = makeRemoteItemRow('item-1', 'p1')

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: projectRow, error: null }),
        } as unknown
      }
      if (table === 'locations') {
        return mockSelectQuery({ data: [locationRow], error: null }) as unknown
      }
      if (table === 'items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [itemRow], error: null }),
        } as unknown
      }
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as unknown
      }
      if (table === 'project_sync_state') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: { last_modified_at: '2026-06-01T12:00:00Z' }, error: null }),
        } as unknown
      }
      if (table === 'evidence') {
        return emptyEvidenceQueryMock as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    const result = await downloadProject('p1')

    expect(result.success).toBe(true)
    const saved = await db.projects.get('p1')
    expect(saved?.downloadState).toBe('device')
  })

  it('grava syncedAt baseline a partir de project_sync_state.last_modified_at', async () => {
    const projectRow = makeRemoteProjectRow('p1')
    const locationRow = makeRemoteLocationRow('loc-1', 'p1')
    const itemRow = makeRemoteItemRow('item-1', 'p1')

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: projectRow, error: null }),
        } as unknown
      }
      if (table === 'locations') {
        return mockSelectQuery({ data: [locationRow], error: null }) as unknown
      }
      if (table === 'items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [itemRow], error: null }),
        } as unknown
      }
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as unknown
      }
      if (table === 'project_sync_state') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: { last_modified_at: '2026-06-01T12:00:00Z' }, error: null }),
        } as unknown
      }
      if (table === 'evidence') {
        return emptyEvidenceQueryMock as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    await downloadProject('p1')

    const saved = await db.projects.get('p1')
    expect(saved?.syncedAt).toEqual(new Date('2026-06-01T12:00:00Z'))
    expect(saved?.updateState).toBe('updated')
  })

  it('retorna success=false quando supabase retorna erro para o projeto', async () => {
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        } as unknown
      }
      if (table === 'locations') {
        return mockSelectQuery({ data: [], error: null }) as unknown
      }
      if (table === 'items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown
      }
      if (table === 'project_sync_state') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    const result = await downloadProject('p1')

    expect(result.success).toBe(false)
  })

  it('grava evidências com storagePath sem baixar blobs no downloadProject', async () => {
    const photoBlob = new Blob(['photo'], { type: 'image/jpeg' })
    mockStorageDownload(photoBlob)

    const projectRow = makeRemoteProjectRow('p1')
    const locationRow = makeRemoteLocationRow('loc-1', 'p1')
    const itemRow = makeRemoteItemRow('item-1', 'p1')
    const photoEvidence = makeRemoteEvidenceRow('ev-photo', 'item-1')
    const commentEvidence = makeRemoteEvidenceRow('ev-comment', 'item-1', {
      type: 'comment',
      blob_url: null,
      comment: 'Nota de vistoria',
    })

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: projectRow, error: null }),
        } as unknown
      }
      if (table === 'locations') {
        return mockSelectQuery({ data: [locationRow], error: null }) as unknown
      }
      if (table === 'items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [itemRow], error: null }),
        } as unknown
      }
      if (table === 'evidence') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: [photoEvidence, commentEvidence], error: null }),
        } as unknown
      }
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as unknown
      }
      if (table === 'project_sync_state') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({ data: { last_modified_at: '2026-06-01T12:00:00Z' }, error: null }),
        } as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    const result = await downloadProject('p1')

    expect(result.success).toBe(true)
    const photo = await db.evidence.get('ev-photo')
    const comment = await db.evidence.get('ev-comment')
    expect(photo?.blob).toBeNull()
    expect(photo?.storagePath).toBe('p1/item-1/ev-photo')
    expect(photo?.syncedAt).toEqual(new Date('2026-06-01T12:00:00Z'))
    expect(vi.mocked(supabase.storage.from)).not.toHaveBeenCalled()
    expect(comment?.blob).toBeNull()
    expect(comment?.comment).toBe('Nota de vistoria')
  })
})

describe('pullUpdates', () => {
  it('escreve updateState=updated no Dexie após pull bem-sucedido', async () => {
    await db.projects.add(makeLocalProject('p1'))

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'locations') {
        return mockSelectQuery({ data: [], error: null }) as unknown
      }
      if (table === 'items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown
      }
      if (table === 'evidence') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    const result = await pullUpdates('p1')

    expect(result.success).toBe(true)
    const updated = await db.projects.get('p1')
    expect(updated!.updateState).toBe('updated')
  })

  it('atualiza syncedAt para data posterior ao syncedAt original', async () => {
    const originalSyncedAt = new Date('2020-01-01')
    await db.projects.add(makeLocalProject('p1'))

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'locations') {
        return mockSelectQuery({ data: [], error: null }) as unknown
      }
      if (table === 'items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown
      }
      if (table === 'evidence') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    await pullUpdates('p1')

    const updated = await db.projects.get('p1')
    expect(updated!.syncedAt).not.toBeNull()
    expect(updated!.syncedAt!.getTime()).toBeGreaterThan(originalSyncedAt.getTime())
  })

  it('retorna success=false quando supabase retorna erro para locations', async () => {
    await db.projects.add(makeLocalProject('p1'))

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'locations') {
        return mockSelectQuery({ data: null, error: { message: 'DB error' } }) as unknown
      }
      if (table === 'items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    const result = await pullUpdates('p1')

    expect(result.success).toBe(false)
  })

  it('marca conflictStatus e conflictRemoteStatus quando status diverge do servidor', async () => {
    await db.projects.add(makeLocalProject('p1'))
    await db.items.add({
      id: 'item-1',
      projectId: 'p1',
      locationId: null,
      description: 'Old',
      category: 'other',
      status: 'pending',
      deletedAt: null,
      deletedById: null,
      updatedAt: new Date('2020-01-01'),
      technicianId: 'tech-1',
      syncedAt: new Date('2020-01-01'),
      conflictStatus: false,
      conflictRemoteStatus: null,
    })

    const remoteItem = {
      ...makeRemoteItemRow('item-1', 'p1'),
      status: 'irregular',
      description: 'New from server',
      updated_at: new Date('2026-01-01').toISOString(),
    }

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [remoteItem], error: null }),
        } as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    const result = await pullUpdates('p1')

    expect(result.success).toBe(true)
    const updated = await db.items.get('item-1')
    expect(updated?.status).toBe('pending') // status local é preservado no conflito
    expect(updated?.conflictStatus).toBe(true)
    expect(updated?.conflictRemoteStatus).toBe('irregular')
    expect(updated?.description).toBe('New from server')
  })

  it('atualiza item sem conflito e grava syncedAt não-nulo (regressão: pull repetido deve continuar detectando mudanças)', async () => {
    await db.projects.add(makeLocalProject('p1'))
    await db.items.add({
      id: 'item-1',
      projectId: 'p1',
      locationId: null,
      description: 'Old',
      category: 'other',
      status: 'pending',
      deletedAt: null,
      deletedById: null,
      updatedAt: new Date('2020-01-01'),
      technicianId: 'tech-1',
      syncedAt: new Date('2020-01-01'),
      conflictStatus: false,
      conflictRemoteStatus: null,
    })

    const remoteItem = {
      ...makeRemoteItemRow('item-1', 'p1'),
      status: 'pending',
      description: 'Same status, new description',
      updated_at: new Date('2026-01-01').toISOString(),
    }

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [remoteItem], error: null }),
        } as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    await pullUpdates('p1')

    const updated = await db.items.get('item-1')
    expect(updated?.description).toBe('Same status, new description')
    expect(updated?.syncedAt).not.toBeNull()
  })

  it('grava evidência remota com storagePath sem baixar blob no pull', async () => {
    const photoBlob = new Blob(['photo'], { type: 'image/jpeg' })
    mockStorageDownload(photoBlob)

    await db.projects.add(makeLocalProject('p1'))
    await db.items.add({
      id: 'item-1',
      projectId: 'p1',
      locationId: null,
      description: 'Item',
      category: 'other',
      status: 'pending',
      deletedAt: null,
      deletedById: null,
      updatedAt: new Date('2020-01-01'),
      technicianId: 'tech-1',
      syncedAt: new Date('2020-01-01'),
      conflictStatus: false,
      conflictRemoteStatus: null,
    })

    const remoteEvidence = makeRemoteEvidenceRow('ev-1', 'item-1')

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'evidence') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [remoteEvidence], error: null }),
        } as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    const result = await pullUpdates('p1')

    expect(result.success).toBe(true)
    const saved = await db.evidence.get('ev-1')
    expect(saved?.blob).toBeNull()
    expect(saved?.storagePath).toBe('p1/item-1/ev-1')
    expect(saved?.syncedAt).toEqual(new Date('2026-06-01T12:00:00Z'))
    expect(vi.mocked(supabase.storage.from)).not.toHaveBeenCalled()
  })

  it('não re-aplica evidência remota quando evidence_delete pendente na fila', async () => {
    mockStorageDownload(new Blob(['remote'], { type: 'image/jpeg' }))

    await db.projects.add(makeLocalProject('p1'))
    await db.items.add({
      id: 'item-1',
      projectId: 'p1',
      locationId: null,
      description: 'Item',
      category: 'other',
      status: 'pending',
      deletedAt: null,
      deletedById: null,
      updatedAt: new Date('2020-01-01'),
      technicianId: 'tech-1',
      syncedAt: new Date('2020-01-01'),
      conflictStatus: false,
      conflictRemoteStatus: null,
    })
    await db.syncQueue.add({
      type: 'evidence_delete',
      payload: JSON.stringify({ evidenceId: 'ev-1', itemId: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })

    const remoteEvidence = makeRemoteEvidenceRow('ev-1', 'item-1')

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'evidence') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [remoteEvidence], error: null }),
        } as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    await pullUpdates('p1')

    const saved = await db.evidence.get('ev-1')
    expect(saved).toBeUndefined()
  })

  it('preserva evidência local com syncedAt null no pull', async () => {
    const localBlob = new Blob(['local'], { type: 'image/jpeg' })
    const remoteBlob = new Blob(['remote'], { type: 'image/jpeg' })
    mockStorageDownload(remoteBlob)

    await db.projects.add(makeLocalProject('p1'))
    await db.items.add({
      id: 'item-1',
      projectId: 'p1',
      locationId: null,
      description: 'Item',
      category: 'other',
      status: 'pending',
      deletedAt: null,
      deletedById: null,
      updatedAt: new Date('2020-01-01'),
      technicianId: 'tech-1',
      syncedAt: new Date('2020-01-01'),
      conflictStatus: false,
      conflictRemoteStatus: null,
    })
    await db.evidence.add({
      id: 'ev-1',
      itemId: 'item-1',
      type: 'photo',
      blob: localBlob,
      storagePath: null,
      comment: null,
      createdAt: new Date(),
      technicianId: 'tech-1',
      syncedAt: null,
    })

    const remoteEvidence = makeRemoteEvidenceRow('ev-1', 'item-1', {
      updated_at: new Date('2026-07-01T12:00:00Z').toISOString(),
    })

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'evidence') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gt: vi.fn().mockResolvedValue({ data: [remoteEvidence], error: null }),
        } as unknown
      }
      return mockSelectQuery({ data: [], error: null }) as unknown
    }) as typeof supabase.from)

    await pullUpdates('p1')

    const saved = await db.evidence.get('ev-1')
    expect(saved?.syncedAt).toBeNull()
    expect(saved?.blob).not.toBeNull()
  })
})

describe('checkForUpdates', () => {
  it('define updateState=update_available quando servidor tem dados mais recentes que syncedAt local', async () => {
    await db.projects.add({
      ...makeLocalProject('p1'),
      syncedAt: new Date('2020-01-01'),
      updateState: 'updated',
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { last_modified_at: '2026-06-01T00:00:00Z' }, error: null }),
    } as unknown as ReturnType<typeof supabase.from>)

    await checkForUpdates('p1')

    const updated = await db.projects.get('p1')
    expect(updated!.updateState).toBe('update_available')
  })

  it('não altera updateState quando last_modified_at é igual ao syncedAt', async () => {
    const syncedAt = new Date('2026-06-01T00:00:00Z')
    await db.projects.add({
      ...makeLocalProject('p1'),
      syncedAt,
      updateState: 'updated',
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: { last_modified_at: '2026-06-01T00:00:00Z' }, error: null }),
    } as unknown as ReturnType<typeof supabase.from>)

    await checkForUpdates('p1')

    const unchanged = await db.projects.get('p1')
    expect(unchanged!.updateState).toBe('updated')
  })
})

describe('syncProjectList', () => {
  it('preserva updateState e syncedAt de projetos no dispositivo', async () => {
    const syncedAt = new Date('2026-06-01T00:00:00Z')
    await db.projects.add({
      ...makeLocalProject('p1'),
      updateState: 'update_available',
      syncedAt,
      serverUpdatedAt: new Date('2026-06-02T00:00:00Z'),
      name: 'Local Name',
    })

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [makeRemoteProjectRow('p1')],
          error: null,
        }),
      } as unknown
    }) as typeof supabase.from)

    await syncProjectList()

    const updated = await db.projects.get('p1')
    expect(updated!.updateState).toBe('update_available')
    expect(updated!.syncedAt).toEqual(syncedAt)
    expect(updated!.serverUpdatedAt).toEqual(new Date('2026-06-02T00:00:00Z'))
    expect(updated!.name).toBe('Test Project')
  })
})

describe('refreshRemoteProjectMetadata', () => {
  it('executa syncProjectList antes de checkForUpdates', async () => {
    const callOrder: string[] = []

    await db.projects.add({
      ...makeLocalProject('p1'),
      syncedAt: new Date('2020-01-01'),
      updateState: 'updated',
    })

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn().mockImplementation(async () => {
            callOrder.push('syncProjectList')
            return { data: [makeRemoteProjectRow('p1')], error: null }
          }),
        } as unknown
      }
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown
      }
      if (table === 'project_sync_state') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(async () => {
            callOrder.push('checkForUpdates')
            return { data: { last_modified_at: '2026-06-01T00:00:00Z' }, error: null }
          }),
        } as unknown
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as unknown
    }) as typeof supabase.from)

    await refreshRemoteProjectMetadata()

    expect(callOrder).toEqual(['syncProjectList', 'checkForUpdates'])
    const updated = await db.projects.get('p1')
    expect(updated!.updateState).toBe('update_available')
  })
})
