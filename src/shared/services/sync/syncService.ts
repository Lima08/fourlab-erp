import { db } from '@/shared/db/dexie'
import type { Item, ItemCategory, ItemStatus } from '@/shared/db/dexie'
import type { Tables } from '@/shared/db/database.types'
import { supabase } from '@/shared/db/supabase'
import {
  downloadEvidenceBlob,
  hydrateRemoteEvidence,
  mapRemoteEvidenceMetadata,
} from './evidenceDownload'
import {
  toLocalClient,
  toLocalEvidence,
  toLocalItem,
  toLocalLocation,
  toLocalProject,
} from './mappers'
import { drainQueue as _drainQueue } from './queueProcessor'
import { parseQueuePending } from './queuePending'
import { recomputeProjectProgress } from '@/campo/utils/inspectionStats'

export type SyncResult = { success: true } | { success: false; error: string }

export type ProjectDeleteStatus = {
  existsRemotely: boolean
  hasPendingChanges: boolean
}

export type RemoteOnlyItem = Pick<Item, 'id' | 'description' | 'category' | 'status'>

export type MediaDownloadProgress = {
  done: number
  total: number
  failed: number
}

export { _drainQueue as drainQueue }

export async function downloadProject(projectId: string): Promise<SyncResult> {
  if (!navigator.onLine) {
    return { success: false, error: 'Sem conexão — tente ao voltar online' }
  }

  const [
    { data: projectRow, error: projErr },
    { data: locationRows, error: locErr },
    { data: itemRows, error: itemErr },
    { data: syncStateRow },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('locations').select('*').eq('project_id', projectId).is('deleted_at', null),
    supabase.from('items').select('*').eq('project_id', projectId),
    supabase
      .from('project_sync_state')
      .select('last_modified_at')
      .eq('project_id', projectId)
      .single(),
  ])

  if (projErr || !projectRow) return { success: false, error: 'Projeto não encontrado' }
  if (locErr) return { success: false, error: locErr.message }
  if (itemErr) return { success: false, error: itemErr.message }

  // buscar cliente associado (best-effort — falha silenciosa)
  const { data: clientRow } = await supabase
    .from('clients')
    .select('*')
    .eq('id', projectRow.client_id)
    .single()

  const project = toLocalProject(projectRow)
  const locations = (locationRows ?? []).map(toLocalLocation)
  const items = (itemRows ?? []).map(toLocalItem)
  const itemIds = items.map((i) => i.id)

  let remoteEvidence: Tables<'evidence'>[] = []
  if (itemIds.length > 0) {
    const { data: evidenceData, error: evErr } = await supabase
      .from('evidence')
      .select('*')
      .in('item_id', itemIds)

    if (evErr) return { success: false, error: evErr.message }
    remoteEvidence = evidenceData ?? []
  }

  // Hybrid B: metadata + storagePath only — blobs via downloadProjectMedia or signed URL
  const evidence = remoteEvidence.map(toLocalEvidence)

  const now = new Date()
  const syncedAt = syncStateRow?.last_modified_at ? new Date(syncStateRow.last_modified_at) : now

  await db.transaction(
    'rw',
    [db.clients, db.projects, db.locations, db.items, db.evidence, db.syncQueue],
    async () => {
      if (clientRow) {
        await db.clients.put(toLocalClient(clientRow))
      }
      await db.projects.put({
        ...project,
        downloadState: 'device',
        downloadedAt: now,
        syncedAt,
        updateState: 'updated',
        serverUpdatedAt: null,
      })
      await db.locations.bulkPut(locations)
      await db.items.bulkPut(items)
      await db.evidence.bulkPut(evidence)
      await recomputeProjectProgress(projectId)
    }
  )

  return { success: true }
}

/** Hydrate missing media blobs for offline use (hybrid B). */
export async function downloadProjectMedia(
  projectId: string,
  onProgress?: (progress: MediaDownloadProgress) => void
): Promise<SyncResult> {
  if (!navigator.onLine) {
    return { success: false, error: 'Sem conexão — tente ao voltar online' }
  }

  const items = await db.items.where('projectId').equals(projectId).toArray()
  const itemIds = items.map((i) => i.id)
  if (itemIds.length === 0) return { success: true }

  const evidences = await db.evidence.where('itemId').anyOf(itemIds).toArray()
  const missing = evidences.filter(
    (e) => e.type !== 'comment' && e.storagePath !== null && e.blob === null
  )

  let done = 0
  let failed = 0
  const total = missing.length
  onProgress?.({ done, total, failed })

  for (const ev of missing) {
    try {
      const blob = await downloadEvidenceBlob(ev.storagePath!)
      await db.evidence.update(ev.id, {
        blob,
        syncedAt: ev.syncedAt ?? new Date(),
      })
    } catch (error) {
      console.warn(`Falha ao baixar mídia ${ev.id}:`, error)
      failed += 1
    }
    done += 1
    onProgress?.({ done, total, failed })
  }

  if (failed > 0 && failed === total) {
    return { success: false, error: 'Falha ao baixar mídias' }
  }

  return { success: true }
}

export async function syncProjectList(): Promise<void> {
  if (!navigator.onLine) return
  const { data, error } = await supabase.from('projects').select('*')
  if (error || !data) return

  const queueEntries = await db.syncQueue.toArray()
  const { pendingProjectIds } = parseQueuePending(queueEntries)

  const clientIds = [...new Set(data.map((row) => row.client_id))]
  const { data: clientRows } =
    clientIds.length > 0
      ? await supabase.from('clients').select('*').in('id', clientIds)
      : { data: [] as Tables<'clients'>[] }
  const clients = (clientRows ?? []).map(toLocalClient)

  await db.transaction('rw', [db.clients, db.projects], async () => {
    if (clients.length > 0) {
      await db.clients.bulkPut(clients)
    }
    for (const row of data) {
      const existing = await db.projects.get(row.id)
      const remote = toLocalProject(row)
      if (!existing) {
        await db.projects.put({ ...remote, downloadState: 'cloud' })
      } else if (existing.downloadState === 'cloud') {
        await db.projects.put(remote)
      } else {
        const update: Partial<typeof remote> = {
          name: remote.name,
          clientId: remote.clientId,
          responsibleProfileId: remote.responsibleProfileId,
          totalArea: remote.totalArea,
          documentType: remote.documentType,
          documentStoragePath: remote.documentStoragePath,
          street: remote.street,
          number: remote.number,
          complement: remote.complement,
          neighborhood: remote.neighborhood,
          city: remote.city,
          state: remote.state,
          postalCode: remote.postalCode,
          description: remote.description,
          createdAt: remote.createdAt,
          totalItems: remote.totalItems,
          completedItems: remote.completedItems,
        }
        // Do not clobber local status while project_update is pending
        if (!pendingProjectIds.has(row.id)) {
          update.status = remote.status
        }
        await db.projects.update(row.id, update)
      }
    }
  })
}

export async function syncStructure(projectId: string): Promise<SyncResult> {
  if (!navigator.onLine) {
    return { success: false, error: 'Sem conexão — tente ao voltar online' }
  }

  const [{ data: locationRows, error: locErr }, { data: itemRows, error: itemErr }] =
    await Promise.all([
      supabase.from('locations').select('*').eq('project_id', projectId).is('deleted_at', null),
      supabase.from('items').select('*').eq('project_id', projectId),
    ])

  if (locErr) return { success: false, error: locErr.message }
  if (itemErr) return { success: false, error: itemErr.message }

  const remoteLocations = (locationRows ?? []).map(toLocalLocation)
  const remoteItems = (itemRows ?? []).map(toLocalItem)
  const remoteItemIds = new Set(remoteItems.map((i) => i.id))

  await db.transaction('rw', db.locations, db.items, db.projects, async () => {
    // locations: overwrite all (no local progress)
    for (const loc of remoteLocations) {
      await db.locations.put(loc)
    }

    // items: merge by rules
    const localItems = await db.items.where('projectId').equals(projectId).toArray()
    const localItemMap = new Map(localItems.map((i) => [i.id, i]))

    for (const remote of remoteItems) {
      const local = localItemMap.get(remote.id)
      if (!local) {
        await db.items.add({ ...remote, status: 'pending' })
      } else if (local.status === 'pending') {
        await db.items.put(remote)
      } else {
        await db.items.update(remote.id, {
          description: remote.description,
          category: remote.category,
          locationId: remote.locationId,
        })
      }
    }

    // soft-delete items removed from remote
    for (const local of localItems) {
      if (!remoteItemIds.has(local.id) && local.deletedAt === null) {
        await db.items.update(local.id, { deletedAt: new Date() })
      }
    }

    await db.projects.update(projectId, { updateState: 'updated', syncedAt: new Date() })
  })

  return { success: true }
}

export async function getProjectDeleteStatus(projectId: string): Promise<ProjectDeleteStatus> {
  const { data } = await supabase.from('projects').select('id').eq('id', projectId).maybeSingle()
  const existsRemotely = data !== null

  const localItems = await db.items.where('projectId').equals(projectId).toArray()
  const localItemIds = new Set(localItems.map((i) => i.id))
  const localLocationIds = new Set(
    (await db.locations.where('projectId').equals(projectId).toArray()).map((l) => l.id)
  )
  const queueEntries = await db.syncQueue.toArray()
  const { pendingItemIds, pendingProjectIds, pendingLocationIds } = parseQueuePending(queueEntries)

  const hasPendingChanges =
    pendingProjectIds.has(projectId) ||
    [...pendingItemIds].some((id) => localItemIds.has(id)) ||
    [...pendingLocationIds].some((id) => localLocationIds.has(id))

  return { existsRemotely, hasPendingChanges }
}

export async function deleteLocalProjectData(
  projectId: string,
  options: { existsRemotely: boolean }
): Promise<void> {
  const localItems = await db.items.where('projectId').equals(projectId).toArray()
  const itemIds = new Set(localItems.map((i) => i.id))
  const localLocations = await db.locations.where('projectId').equals(projectId).toArray()
  const locationIds = new Set(localLocations.map((l) => l.id))

  const queueEntries = await db.syncQueue.toArray()
  const queueIdsToDelete = queueEntries
    .filter((e) => {
      try {
        const payload = JSON.parse(e.payload) as Record<string, unknown>
        if (e.type === 'project_update' && payload.projectId === projectId) return true
        if (
          (e.type === 'location_add' || e.type === 'location_update') &&
          typeof payload.id === 'string' &&
          locationIds.has(payload.id)
        ) {
          return true
        }
        if (
          e.type === 'location_delete' &&
          typeof payload.locationId === 'string' &&
          locationIds.has(payload.locationId)
        ) {
          return true
        }
        const itemId = (payload.id ?? payload.itemId) as string | undefined
        return itemId !== undefined && itemIds.has(itemId)
      } catch {
        return false
      }
    })
    .map((e) => e.id!)

  await db.transaction(
    'rw',
    [db.projects, db.locations, db.items, db.evidence, db.syncQueue],
    async () => {
      const project = await db.projects.get(projectId)

      if (itemIds.size > 0) {
        await db.evidence
          .where('itemId')
          .anyOf([...itemIds])
          .delete()
      }
      await db.syncQueue.bulkDelete(queueIdsToDelete)
      await db.items.where('projectId').equals(projectId).delete()
      await db.locations.where('projectId').equals(projectId).delete()

      if (options.existsRemotely && project) {
        await db.projects.put({
          ...project,
          downloadState: 'cloud',
          updateState: 'updated',
          downloadedAt: new Date(0),
          syncedAt: null,
          serverUpdatedAt: null,
          completedItems: 0,
          totalItems: 0,
        })
      } else {
        await db.projects.delete(projectId)
      }
    }
  )
}

export async function findSyncConflicts(
  projectId: string
): Promise<{ remoteOnlyItems: RemoteOnlyItem[] }> {
  const { data: remoteRows, error } = await supabase
    .from('items')
    .select('id, description, category, status')
    .eq('project_id', projectId)
    .is('deleted_at', null)

  if (error || !remoteRows) return { remoteOnlyItems: [] }

  const localItems = await db.items
    .where('projectId')
    .equals(projectId)
    .filter((i) => i.deletedAt === null)
    .toArray()
  const localIds = new Set(localItems.map((i) => i.id))

  const remoteOnlyItems: RemoteOnlyItem[] = remoteRows
    .filter((r) => !localIds.has(r.id))
    .map((r) => ({
      id: r.id,
      description: r.description,
      category: r.category as Item['category'],
      status: r.status as Item['status'],
    }))

  return { remoteOnlyItems }
}

export async function pullRemoteItems(projectId: string, itemIds: string[]): Promise<SyncResult> {
  if (!navigator.onLine) return { success: false, error: 'Sem conexão' }

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .in('id', itemIds)
    .eq('project_id', projectId)

  if (error || !data) return { success: false, error: error?.message ?? 'Erro ao buscar itens' }

  await db.items.bulkPut(data.map(toLocalItem))
  return { success: true }
}

export async function markProjectSynced(projectId: string): Promise<void> {
  await db.projects.update(projectId, {
    syncedAt: new Date(),
    updateState: 'updated',
    serverUpdatedAt: null,
  })
}

export async function checkForUpdates(projectId: string): Promise<void> {
  if (!navigator.onLine) return

  const { data, error } = await supabase
    .from('project_sync_state')
    .select('last_modified_at')
    .eq('project_id', projectId)
    .single()

  if (error || !data) return

  const project = await db.projects.get(projectId)
  if (!project || project.downloadState !== 'device') return

  if (
    data.last_modified_at !== null &&
    (project.syncedAt === null || new Date(data.last_modified_at) > project.syncedAt)
  ) {
    await db.projects.update(projectId, {
      updateState: 'update_available',
      serverUpdatedAt: new Date(data.last_modified_at),
    })
  }
}

export async function checkAllProjectsForUpdates(): Promise<void> {
  if (!navigator.onLine) return

  const projects = await db.projects.where('downloadState').equals('device').toArray()
  await Promise.allSettled(projects.map((p) => checkForUpdates(p.id)))
}

export async function refreshRemoteProjectMetadata(): Promise<void> {
  if (!navigator.onLine) return
  await syncProjectList()
  await checkAllProjectsForUpdates()
}

export async function pullUpdates(projectId: string): Promise<SyncResult> {
  if (!navigator.onLine) return { success: false, error: 'Sem conexão' }

  const project = await db.projects.get(projectId)
  if (!project) return { success: false, error: 'Projeto não encontrado' }

  const since = project.syncedAt?.toISOString() ?? new Date(0).toISOString()

  const [{ data: remoteLocations, error: locErr }, { data: remoteItems, error: itemErr }] =
    await Promise.all([
      supabase
        .from('locations')
        .select('*')
        .eq('project_id', projectId)
        .gt('updated_at', since)
        .is('deleted_at', null),
      supabase.from('items').select('*').eq('project_id', projectId).gt('updated_at', since),
    ])

  if (locErr) return { success: false, error: locErr.message }
  if (itemErr) return { success: false, error: itemErr.message }

  const localItems = await db.items.where('projectId').equals(projectId).toArray()
  const localItemIds = localItems.map((i) => i.id)

  const allItemIds = [...new Set([...(remoteItems ?? []).map((i) => i.id), ...localItemIds])]

  let remoteEvidence: Tables<'evidence'>[] = []
  if (allItemIds.length > 0) {
    const { data: evidenceData, error: evErr } = await supabase
      .from('evidence')
      .select('*')
      .in('item_id', allItemIds)
      .gt('updated_at', since)

    if (evErr) return { success: false, error: evErr.message }
    remoteEvidence = evidenceData ?? []
  }

  const queueEntries = await db.syncQueue.toArray()
  const { pendingItemIds, pendingLocationIds, pendingEvidenceDeleteIds } =
    parseQueuePending(queueEntries)

  const filteredEvidence = remoteEvidence.filter((e) => !pendingEvidenceDeleteIds.has(e.id))

  const hydratedIds = filteredEvidence.map((e) => e.id)
  const localEvidenceMap = new Map(
    hydratedIds.length > 0
      ? (await db.evidence.where('id').anyOf(hydratedIds).toArray()).map((e) => [e.id, e])
      : []
  )

  // Metadata only — preserve local unsynced evidence and already-hydrated blobs
  const evidenceToPut = filteredEvidence
    .map((remote) => mapRemoteEvidenceMetadata(remote, localEvidenceMap.get(remote.id)))
    .filter((ev) => {
      const local = localEvidenceMap.get(ev.id)
      return !(local && local.syncedAt === null)
    })

  const locationsToPut = (remoteLocations ?? [])
    .map(toLocalLocation)
    .filter((loc) => !pendingLocationIds.has(loc.id))

  await db.transaction(
    'rw',
    [db.locations, db.items, db.evidence, db.projects, db.syncQueue],
    async () => {
      if (locationsToPut.length > 0) {
        await db.locations.bulkPut(locationsToPut)
      }

      const localItemMap = new Map(localItems.map((i) => [i.id, i]))

      for (const remoteItem of remoteItems ?? []) {
        const local = localItemMap.get(remoteItem.id)
        if (!local) continue // item ainda não baixado — tratado pelo fluxo de conflitos (findSyncConflicts)

        // syncedAt pode estar null tanto por edição local pendente quanto por dado legado
        // pré-migração — a syncQueue é a fonte confiável de "há edição local não enviada"
        if (pendingItemIds.has(remoteItem.id)) continue

        const localBaseline = local.syncedAt ?? local.updatedAt
        if (remoteItem.updated_at <= localBaseline.toISOString()) continue

        // server has newer version — check for conflict in critical field
        if (remoteItem.status !== local.status) {
          await db.items.update(remoteItem.id, {
            description: remoteItem.description,
            category: remoteItem.category as ItemCategory,
            locationId: remoteItem.location_id,
            updatedAt: new Date(remoteItem.updated_at),
            syncedAt: new Date(remoteItem.updated_at),
            conflictStatus: true,
            conflictRemoteStatus: remoteItem.status as ItemStatus,
          })
        } else {
          await db.items.put(toLocalItem(remoteItem))
        }
      }

      await db.evidence.bulkPut(evidenceToPut)
      await recomputeProjectProgress(projectId)

      const now = new Date()
      await db.projects.update(projectId, {
        syncedAt: now,
        serverUpdatedAt: null,
        updateState: 'updated',
      })
    }
  )

  return { success: true }
}

// Re-export hydrate for optional offline media prep / tests
export { hydrateRemoteEvidence }
