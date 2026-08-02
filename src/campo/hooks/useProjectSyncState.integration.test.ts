import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '@/shared/db/dexie'
import type { Item, Project } from '@/shared/db/dexie'
import { enqueueItemUpdate } from '@/shared/services/sync/queueProcessor'
import { useProjectSyncState } from '@/campo/hooks/useProjectSyncState'

vi.mock('@/shared/db/supabase', () => ({
  supabase: { from: vi.fn(), storage: { from: vi.fn() } },
}))

async function getSyncState(projectId: string) {
  const project = await db.projects.get(projectId)
  if (!project) return 'synced'
  if (project.updateState === 'update_available') return 'update_available'
  const projectItemIds = new Set(
    (await db.items.where('projectId').equals(projectId).primaryKeys()) as string[]
  )
  const queueEntries = await db.syncQueue.toArray()
  const hasPending = queueEntries.some((e) => {
    try {
      const payload = JSON.parse(e.payload) as Record<string, unknown>
      const itemId = (payload.id ?? payload.itemId) as string | undefined
      return itemId !== undefined && projectItemIds.has(itemId)
    } catch {
      return false
    }
  })
  return hasPending ? 'pending' : 'synced'
}

const makeProject = (
  id: string,
  updateState: 'updated' | 'update_available' = 'updated'
): Project => ({
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
  status: 'pending',
  downloadState: 'device',
  updateState,
  completedItems: 0,
  totalItems: 0,
  downloadedAt: new Date(),
  syncedAt: null,
  serverUpdatedAt: null,
})

const makeItem = (id: string, projectId: string): Item => ({
  id,
  projectId,
  locationId: null,
  description: 'Test',
  category: 'other',
  status: 'pending',
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

describe('getSyncState integration', () => {
  it('retorna update_available quando projeto tem updateState=update_available', async () => {
    const project = makeProject('proj-1', 'update_available')
    await db.projects.put(project)

    expect(await getSyncState('proj-1')).toBe('update_available')
  })

  it('retorna pending após enfileirar e synced após limpar fila', async () => {
    const project = makeProject('proj-2', 'updated')
    const item = makeItem('item-2', 'proj-2')
    await db.projects.put(project)
    await db.items.put(item)
    await enqueueItemUpdate(item)

    expect(await getSyncState('proj-2')).toBe('pending')

    await db.syncQueue.clear()

    expect(await getSyncState('proj-2')).toBe('synced')
  })

  it('retorna synced após simular pullUpdates (updateState resetado para updated)', async () => {
    const project = makeProject('proj-3', 'update_available')
    const item = makeItem('item-3', 'proj-3')
    await db.projects.put(project)
    await db.items.put(item)

    await db.projects.update('proj-3', { updateState: 'updated' })

    expect(await getSyncState('proj-3')).toBe('synced')
  })

  it('entradas da fila de outro projeto não afetam este projeto', async () => {
    const projectA = makeProject('proj-a', 'updated')
    const projectB = makeProject('proj-b', 'updated')
    const itemA = makeItem('item-a', 'proj-a')
    const itemB = makeItem('item-b', 'proj-b')

    await db.projects.put(projectA)
    await db.projects.put(projectB)
    await db.items.put(itemA)
    await db.items.put(itemB)

    await enqueueItemUpdate(itemB)

    expect(await getSyncState('proj-a')).toBe('synced')
  })
})

describe('useProjectSyncState hook', () => {
  it('retorna pendingCount igual ao nº de entradas do projeto na fila', async () => {
    const project = makeProject('proj-4', 'updated')
    const item1 = makeItem('item-4a', 'proj-4')
    const item2 = makeItem('item-4b', 'proj-4')
    await db.projects.put(project)
    await db.items.put(item1)
    await db.items.put(item2)
    await enqueueItemUpdate(item1)
    await enqueueItemUpdate(item2)

    const { result } = renderHook(() => useProjectSyncState('proj-4'))

    await waitFor(() => expect(result.current).toEqual({ syncState: 'pending', pendingCount: 2 }))
  })
})
