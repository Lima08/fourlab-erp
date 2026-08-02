import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '@/shared/db/dexie'
import { deleteLocalProjectData, getProjectDeleteStatus } from './syncService'

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))

const makeProject = (id: string) => ({
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
  updateState: 'updated' as const,
  completedItems: 0,
  totalItems: 0,
  downloadedAt: new Date(),
  syncedAt: null,
  serverUpdatedAt: null,
})

const makeItem = (id: string, projectId: string) => ({
  id,
  projectId,
  locationId: null,
  description: 'Test',
  category: 'other' as const,
  status: 'pending' as const,
  deletedAt: null,
  deletedById: null,
  updatedAt: new Date(),
  technicianId: 'tech-1',
  syncedAt: null,
  conflictStatus: false,
  conflictRemoteStatus: null,
})

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('deleteLocalProjectData', () => {
  it('limpa projeto, itens, locations, evidências e fila quando não está no servidor', async () => {
    await db.projects.add(makeProject('p1'))
    await db.items.add(makeItem('item-1', 'p1'))
    await db.locations.add({
      id: 'loc-1',
      projectId: 'p1',
      name: 'Sala',
      type: 'room',
      deletedAt: null,
      updatedAt: new Date(),
    })
    await db.evidence.add({
      id: 'ev-1',
      itemId: 'item-1',
      type: 'photo',
      blob: null,
      storagePath: null,
      comment: null,
      createdAt: new Date(),
      technicianId: 'tech-1',
      syncedAt: null,
    })
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })

    await deleteLocalProjectData('p1', { existsRemotely: false })

    expect(await db.projects.get('p1')).toBeUndefined()
    expect(await db.items.where('projectId').equals('p1').toArray()).toHaveLength(0)
    expect(await db.locations.where('projectId').equals('p1').toArray()).toHaveLength(0)
    expect(await db.evidence.where('itemId').equals('item-1').toArray()).toHaveLength(0)
    expect(await db.syncQueue.toArray()).toHaveLength(0)
  })

  it('rebaixa projeto para cloud quando existsRemotely é true', async () => {
    await db.projects.add(makeProject('p1'))
    await db.items.add(makeItem('item-1', 'p1'))
    await db.locations.add({
      id: 'loc-1',
      projectId: 'p1',
      name: 'Sala',
      type: 'room',
      deletedAt: null,
      updatedAt: new Date(),
    })
    await db.evidence.add({
      id: 'ev-1',
      itemId: 'item-1',
      type: 'photo',
      blob: null,
      storagePath: null,
      comment: null,
      createdAt: new Date(),
      technicianId: 'tech-1',
      syncedAt: null,
    })
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })

    await deleteLocalProjectData('p1', { existsRemotely: true })

    const project = await db.projects.get('p1')
    expect(project).toBeDefined()
    expect(project?.downloadState).toBe('cloud')
    expect(project?.updateState).toBe('updated')
    expect(project?.name).toBe('Test')
    expect(project?.clientId).toBe('c1')
    expect(project?.syncedAt).toBeNull()
    expect(project?.serverUpdatedAt).toBeNull()
    expect(project?.completedItems).toBe(0)
    expect(project?.totalItems).toBe(0)
    expect(await db.items.where('projectId').equals('p1').toArray()).toHaveLength(0)
    expect(await db.locations.where('projectId').equals('p1').toArray()).toHaveLength(0)
    expect(await db.evidence.where('itemId').equals('item-1').toArray()).toHaveLength(0)
    expect(await db.syncQueue.toArray()).toHaveLength(0)
  })

  it('preserva entradas da fila pertencentes a outro projectId', async () => {
    await db.projects.add(makeProject('p1'))
    await db.projects.add(makeProject('p2'))
    await db.items.add(makeItem('item-1', 'p1'))
    await db.items.add(makeItem('item-2', 'p2'))
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'item-2' }),
      attempts: 0,
      createdAt: new Date(),
    })

    await deleteLocalProjectData('p1', { existsRemotely: false })

    const remaining = await db.syncQueue.toArray()
    expect(remaining).toHaveLength(1)
    expect(JSON.parse(remaining[0]!.payload).id).toBe('item-2')
  })

  it('não lança erro quando projectId não existe', async () => {
    await expect(
      deleteLocalProjectData('nonexistent', { existsRemotely: false })
    ).resolves.toBeUndefined()
  })
})

describe('getProjectDeleteStatus — hasPendingChanges', () => {
  it('retorna hasPendingChanges: true quando fila tem entrada com payload.id de um item', async () => {
    await db.projects.add(makeProject('p1'))
    await db.items.add(makeItem('item-1', 'p1'))
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })

    const result = await getProjectDeleteStatus('p1')
    expect(result.hasPendingChanges).toBe(true)
  })

  it('retorna hasPendingChanges: true quando fila tem entrada com payload.itemId de um item', async () => {
    await db.projects.add(makeProject('p1'))
    await db.items.add(makeItem('item-1', 'p1'))
    await db.syncQueue.add({
      type: 'item_delete',
      payload: JSON.stringify({ itemId: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })

    const result = await getProjectDeleteStatus('p1')
    expect(result.hasPendingChanges).toBe(true)
  })

  it('retorna hasPendingChanges: false quando syncQueue está vazia', async () => {
    await db.projects.add(makeProject('p1'))
    await db.items.add(makeItem('item-1', 'p1'))

    const result = await getProjectDeleteStatus('p1')
    expect(result.hasPendingChanges).toBe(false)
  })

  it('retorna hasPendingChanges: false e não lança erro com payload JSON inválido', async () => {
    await db.projects.add(makeProject('p1'))
    await db.items.add(makeItem('item-1', 'p1'))
    await db.syncQueue.add({
      type: 'item_update',
      payload: 'not-valid-json',
      attempts: 0,
      createdAt: new Date(),
    })

    await expect(getProjectDeleteStatus('p1')).resolves.toMatchObject({ hasPendingChanges: false })
  })
})
