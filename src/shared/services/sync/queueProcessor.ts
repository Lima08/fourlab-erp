import { PHOTO_MAX_BYTES, VIDEO_MAX_BYTES } from '@/shared/constants/evidenceLimits'
import { db } from '@/shared/db/dexie'
import type { Evidence, Item, Location, SyncQueueEntry } from '@/shared/db/dexie'
import { supabase } from '@/shared/db/supabase'
import { useAuthStore } from '@/shared/stores/authStore'
import { toast } from 'sonner'
import { buildDeadLetterToast, EvidenceSyncError } from './evidenceSyncError'
import { evidenceStoragePath } from './evidenceDownload'
import { toRemoteEvidence, toRemoteItem, toRemoteLocation } from './mappers'

async function markSyncedAt(entry: SyncQueueEntry): Promise<void> {
  if (entry.type === 'item_update' || entry.type === 'item_add') {
    const { id } = JSON.parse(entry.payload) as { id: string }
    await db.items.update(id, { syncedAt: new Date() })
  } else if (entry.type === 'evidence_add') {
    const { evidenceId } = JSON.parse(entry.payload) as { evidenceId: string }
    await db.evidence.update(evidenceId, { syncedAt: new Date(), blob: null })
  }
}

export function buildErrorReason(error: unknown): string {
  if (error !== null && typeof error === 'object') {
    const err = error as Record<string, unknown>
    if (typeof err['message'] === 'string') {
      if (typeof err['code'] === 'string') return `${err['code']}: ${err['message']}`
      return err['message']
    }
  }
  return 'Erro desconhecido'
}

async function markItemUnsyncedFromPayload(entry: SyncQueueEntry): Promise<void> {
  if (entry.type !== 'item_update' && entry.type !== 'item_add') return
  try {
    const { id } = JSON.parse(entry.payload) as { id?: string }
    if (id) await db.items.update(id, { syncedAt: null })
  } catch {
    // ignore
  }
}

export async function discardQueueEntry(entryId: number, reason: string): Promise<void> {
  const entry = await db.syncQueue.get(entryId)
  if (!entry) return

  await markItemUnsyncedFromPayload(entry)

  await db.deadLetterQueue.add({
    type: entry.type,
    payload: entry.payload,
    failureReason: reason,
    originalEntryId: entryId,
    createdAt: new Date(),
  })

  await db.syncQueue.delete(entryId)
}

export async function enqueueItemUpdate(item: Item): Promise<void> {
  await db.syncQueue.add({
    type: 'item_update',
    payload: JSON.stringify(item),
    attempts: 0,
    createdAt: new Date(),
  })
}

export async function enqueueItemAdd(item: Item): Promise<void> {
  await db.syncQueue.add({
    type: 'item_add',
    payload: JSON.stringify(item),
    attempts: 0,
    createdAt: new Date(),
  })
}

export async function enqueueItemDelete(itemId: string): Promise<void> {
  await db.syncQueue.add({
    type: 'item_delete',
    payload: JSON.stringify({ itemId }),
    attempts: 0,
    createdAt: new Date(),
  })
}

export async function enqueueEvidenceAdd(evidence: Evidence): Promise<void> {
  await db.syncQueue.add({
    type: 'evidence_add',
    payload: JSON.stringify({ evidenceId: evidence.id, itemId: evidence.itemId }),
    attempts: 0,
    createdAt: new Date(),
  })
}

export async function enqueueEvidenceDelete(evidenceId: string, itemId: string): Promise<void> {
  await db.syncQueue.add({
    type: 'evidence_delete',
    payload: JSON.stringify({ evidenceId, itemId }),
    attempts: 0,
    createdAt: new Date(),
  })
}

export async function enqueueLocationAdd(location: Location): Promise<void> {
  await db.syncQueue.add({
    type: 'location_add',
    payload: JSON.stringify(location),
    attempts: 0,
    createdAt: new Date(),
  })
}

export async function enqueueLocationUpdate(location: Location): Promise<void> {
  await db.syncQueue.add({
    type: 'location_update',
    payload: JSON.stringify(location),
    attempts: 0,
    createdAt: new Date(),
  })
}

export async function enqueueLocationDelete(locationId: string): Promise<void> {
  await db.syncQueue.add({
    type: 'location_delete',
    payload: JSON.stringify({ locationId }),
    attempts: 0,
    createdAt: new Date(),
  })
}

export async function enqueueProjectUpdate(
  projectId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'canceled'
): Promise<void> {
  await db.syncQueue.add({
    type: 'project_update',
    payload: JSON.stringify({ projectId, status }),
    attempts: 0,
    createdAt: new Date(),
  })
}

function requireUserId(): string {
  const userId = useAuthStore.getState().user?.id
  if (!userId) {
    throw new Error('Usuário não autenticado — sync adiado')
  }
  return userId
}

async function processEvidenceAdd(entry: SyncQueueEntry, userId: string): Promise<void> {
  const { evidenceId, itemId } = JSON.parse(entry.payload) as {
    evidenceId: string
    itemId: string
  }

  const ev = await db.evidence.get(evidenceId)
  if (!ev) {
    throw new EvidenceSyncError('NOT_FOUND', `Evidence ${evidenceId} not found`)
  }

  const isComment =
    ev.type === 'comment' || (ev.blob === null && ev.comment !== null && ev.comment !== '')

  if (isComment) {
    const { error: upsertError } = await supabase
      .from('evidence')
      .upsert(toRemoteEvidence(ev, null, userId))
    if (upsertError) throw upsertError
    return
  }

  if (!ev.blob) {
    throw new EvidenceSyncError('MISSING_BLOB', `Evidence ${evidenceId} has no blob`)
  }

  const maxBytes = ev.type === 'video' ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES
  if (ev.blob.size > maxBytes) {
    throw new EvidenceSyncError(
      'SIZE_LIMIT',
      `Evidence ${evidenceId} blob exceeds size limit`,
      ev.type
    )
  }

  const item = await db.items.get(itemId)
  if (!item?.projectId) {
    throw new EvidenceSyncError(
      'NOT_FOUND',
      `Item ${itemId} missing for evidence ${evidenceId} (cannot resolve storage path)`
    )
  }
  const path = evidenceStoragePath(item.projectId, itemId, evidenceId)

  const { error: uploadError } = await supabase.storage
    .from('evidence')
    .upload(path, ev.blob, { contentType: ev.blob.type, upsert: true })
  if (uploadError) throw uploadError

  const { error: upsertError } = await supabase
    .from('evidence')
    .upsert(toRemoteEvidence(ev, path, userId))
  if (upsertError) throw upsertError

  await db.evidence.update(evidenceId, { storagePath: path })
}

async function processEvidenceDelete(entry: SyncQueueEntry): Promise<void> {
  const { evidenceId, itemId } = JSON.parse(entry.payload) as {
    evidenceId: string
    itemId: string
  }

  const { error } = await supabase.from('evidence').delete().eq('id', evidenceId)
  if (error) throw error

  const item = await db.items.get(itemId)
  if (!item?.projectId) {
    // Local item gone — cannot resolve path; Postgres row already deleted
    console.warn(`evidence_delete: item ${itemId} missing; Storage object may remain`)
    return
  }
  const path = evidenceStoragePath(item.projectId, itemId, evidenceId)

  const { error: removeError } = await supabase.storage.from('evidence').remove([path])
  if (removeError && !isStorageNotFoundError(removeError)) {
    throw removeError
  }
}

function isStorageNotFoundError(error: {
  message?: string
  statusCode?: string | number
}): boolean {
  const message = error.message?.toLowerCase() ?? ''
  return (
    message.includes('not found') ||
    message.includes('object not found') ||
    error.statusCode === '404' ||
    error.statusCode === 404
  )
}

async function processEntry(entry: SyncQueueEntry): Promise<void> {
  const userId = requireUserId()

  if (entry.type === 'item_update') {
    const item: Item = JSON.parse(entry.payload)
    if (item.deletedAt !== null) return
    const { error } = await supabase.from('items').upsert(toRemoteItem(item, userId))
    if (error) throw error
  } else if (entry.type === 'item_add') {
    const item: Item = JSON.parse(entry.payload)
    const { error } = await supabase.from('items').upsert(toRemoteItem(item, userId))
    if (error) throw error
  } else if (entry.type === 'item_delete') {
    const { itemId } = JSON.parse(entry.payload) as { itemId: string }
    const { error } = await supabase
      .from('items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', itemId)
    if (error) throw error
  } else if (entry.type === 'evidence_add') {
    await processEvidenceAdd(entry, userId)
  } else if (entry.type === 'evidence_delete') {
    await processEvidenceDelete(entry)
  } else if (entry.type === 'location_add') {
    const location: Location = JSON.parse(entry.payload)
    const { error } = await supabase.from('locations').upsert(toRemoteLocation(location))
    if (error) throw error
  } else if (entry.type === 'location_update') {
    const location: Location = JSON.parse(entry.payload)
    const { error } = await supabase.from('locations').upsert(toRemoteLocation(location))
    if (error) throw error
  } else if (entry.type === 'location_delete') {
    const { locationId } = JSON.parse(entry.payload) as { locationId: string }
    const { error } = await supabase
      .from('locations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', locationId)
    if (error) throw error
  } else if (entry.type === 'project_update') {
    const { projectId, status } = JSON.parse(entry.payload) as {
      projectId: string
      status: 'pending' | 'in_progress' | 'completed' | 'canceled'
    }
    const { error } = await supabase.from('projects').update({ status }).eq('id', projectId)
    if (error) throw error
  }
}

const BATCH_SIZE = 10
const MAX_RETRIES = 3

let drainInFlight: Promise<void> | null = null

async function drainQueueOnce(): Promise<void> {
  // Snapshot IDs at start — each entry gets at most one attempt per drain call.
  // New enqueues during drain wait for the next call.
  const snapshotIds = (await db.syncQueue.orderBy('createdAt').primaryKeys()) as number[]

  for (let i = 0; i < snapshotIds.length; i += BATCH_SIZE) {
    const batchIds = snapshotIds.slice(i, i + BATCH_SIZE)
    for (const id of batchIds) {
      const entry = await db.syncQueue.get(id)
      if (!entry) continue

      try {
        await processEntry(entry)
        await markSyncedAt(entry)
        await db.syncQueue.delete(id)
      } catch (error) {
        if (entry.attempts >= MAX_RETRIES) {
          const reason = buildErrorReason(error)
          await discardQueueEntry(id, reason)
          toast.error(buildDeadLetterToast(error, entry.type))
        } else {
          await db.syncQueue.update(id, { attempts: entry.attempts + 1 })
        }
      }
    }
  }
}

export async function drainQueue(): Promise<void> {
  if (drainInFlight) return drainInFlight

  drainInFlight = drainQueueOnce().finally(() => {
    drainInFlight = null
  })

  return drainInFlight
}

/** @internal test helper — clear in-flight lock between tests */
export function resetDrainLockForTests(): void {
  drainInFlight = null
}
