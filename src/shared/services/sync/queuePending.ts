import type { SyncQueueEntry } from '@/shared/db/dexie'

export interface QueuePendingSets {
  pendingItemIds: Set<string>
  pendingLocationIds: Set<string>
  pendingProjectIds: Set<string>
  pendingEvidenceDeleteIds: Set<string>
}

/** Parse syncQueue entries into typed pending ID sets (by entry type). */
export function parseQueuePending(entries: SyncQueueEntry[]): QueuePendingSets {
  const pendingItemIds = new Set<string>()
  const pendingLocationIds = new Set<string>()
  const pendingProjectIds = new Set<string>()
  const pendingEvidenceDeleteIds = new Set<string>()

  for (const entry of entries) {
    try {
      const payload = JSON.parse(entry.payload) as Record<string, unknown>

      switch (entry.type) {
        case 'item_add':
        case 'item_update': {
          if (typeof payload.id === 'string') pendingItemIds.add(payload.id)
          break
        }
        case 'item_delete': {
          if (typeof payload.itemId === 'string') pendingItemIds.add(payload.itemId)
          break
        }
        case 'evidence_add': {
          if (typeof payload.itemId === 'string') pendingItemIds.add(payload.itemId)
          break
        }
        case 'evidence_delete': {
          if (typeof payload.evidenceId === 'string') {
            pendingEvidenceDeleteIds.add(payload.evidenceId)
          }
          if (typeof payload.itemId === 'string') pendingItemIds.add(payload.itemId)
          break
        }
        case 'location_add':
        case 'location_update': {
          if (typeof payload.id === 'string') pendingLocationIds.add(payload.id)
          break
        }
        case 'location_delete': {
          if (typeof payload.locationId === 'string') {
            pendingLocationIds.add(payload.locationId)
          }
          break
        }
        case 'project_update': {
          if (typeof payload.projectId === 'string') pendingProjectIds.add(payload.projectId)
          break
        }
      }
    } catch {
      // ignore malformed payloads
    }
  }

  return {
    pendingItemIds,
    pendingLocationIds,
    pendingProjectIds,
    pendingEvidenceDeleteIds,
  }
}
