import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/shared/db/dexie'

const makeProject = (id: string, updateState: 'updated' | 'update_available' = 'updated') => ({
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
  updateState,
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
  description: 'Test item',
  category: 'other' as const,
  status: 'pending' as const,
  deletedAt: null,
  deletedById: null,
  updatedAt: new Date(),
  technicianId: 't1',
  syncedAt: null,
  conflictStatus: false,
  conflictRemoteStatus: null,
})

async function getSyncInfo(projectId: string) {
  const project = await db.projects.get(projectId)
  if (!project) return { syncState: 'synced', pendingCount: 0 }
  if (project.updateState === 'update_available')
    return { syncState: 'update_available', pendingCount: 0 }
  const projectItemIds = new Set(
    (await db.items.where('projectId').equals(projectId).primaryKeys()) as string[]
  )
  const queueEntries = await db.syncQueue.toArray()
  const pendingCount = queueEntries.filter((e) => {
    try {
      const payload = JSON.parse(e.payload) as Record<string, unknown>
      const itemId = (payload.id ?? payload.itemId) as string | undefined
      return itemId !== undefined && projectItemIds.has(itemId)
    } catch {
      return false
    }
  }).length
  return { syncState: pendingCount > 0 ? 'pending' : 'synced', pendingCount }
}

async function getSyncState(projectId: string) {
  return (await getSyncInfo(projectId)).syncState
}

describe('useProjectSyncState logic', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('retorna update_available quando project.updateState é update_available', async () => {
    await db.projects.add(makeProject('p1', 'update_available'))
    await db.items.add(makeItem('i1', 'p1'))
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'i1' }),
      attempts: 0,
      createdAt: new Date(),
    })
    expect(await getSyncState('p1')).toBe('update_available')
  })

  it('retorna synced quando projeto não tem entradas na fila', async () => {
    await db.projects.add(makeProject('p1', 'updated'))
    await db.items.add(makeItem('i1', 'p1'))
    expect(await getSyncState('p1')).toBe('synced')
  })

  it('retorna pending quando fila tem entrada com payload.id do item do projeto', async () => {
    await db.projects.add(makeProject('p1', 'updated'))
    await db.items.add(makeItem('i1', 'p1'))
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'i1' }),
      attempts: 0,
      createdAt: new Date(),
    })
    expect(await getSyncState('p1')).toBe('pending')
  })

  it('retorna synced quando entrada da fila pertence a outro projeto', async () => {
    await db.projects.add(makeProject('p1', 'updated'))
    await db.items.add(makeItem('i1', 'p1'))
    await db.projects.add(makeProject('p2', 'updated'))
    await db.items.add(makeItem('i2', 'p2'))
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'i2' }),
      attempts: 0,
      createdAt: new Date(),
    })
    expect(await getSyncState('p1')).toBe('synced')
  })

  it('retorna synced quando projeto não existe', async () => {
    expect(await getSyncState('nonexistent')).toBe('synced')
  })

  it('retorna synced sem lançar erro quando payload da fila é JSON inválido', async () => {
    await db.projects.add(makeProject('p1', 'updated'))
    await db.items.add(makeItem('i1', 'p1'))
    await db.syncQueue.add({
      type: 'item_update',
      payload: 'not valid json {{{',
      attempts: 0,
      createdAt: new Date(),
    })
    expect(await getSyncState('p1')).toBe('synced')
  })

  it('retorna pendingCount igual ao nº de entradas do projeto na fila', async () => {
    await db.projects.add(makeProject('p1', 'updated'))
    await db.items.add(makeItem('i1', 'p1'))
    await db.items.add(makeItem('i2', 'p1'))
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'i1' }),
      attempts: 0,
      createdAt: new Date(),
    })
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'i2' }),
      attempts: 0,
      createdAt: new Date(),
    })
    expect(await getSyncInfo('p1')).toEqual({ syncState: 'pending', pendingCount: 2 })
  })

  it('retorna pendingCount 0 quando projeto não tem entradas na fila', async () => {
    await db.projects.add(makeProject('p1', 'updated'))
    await db.items.add(makeItem('i1', 'p1'))
    expect(await getSyncInfo('p1')).toEqual({ syncState: 'synced', pendingCount: 0 })
  })
})
