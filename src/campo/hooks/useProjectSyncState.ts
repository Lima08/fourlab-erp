import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/dexie'

export type SyncState = 'synced' | 'pending' | 'update_available'

export interface ProjectSyncState {
  syncState: SyncState
  pendingCount: number
}

const DEFAULT_STATE: ProjectSyncState = { syncState: 'synced', pendingCount: 0 }

export function useProjectSyncState(projectId: string): ProjectSyncState {
  return (
    useLiveQuery(
      async () => {
        const project = await db.projects.get(projectId)
        if (!project) return DEFAULT_STATE

        if (project.updateState === 'update_available')
          return { syncState: 'update_available', pendingCount: 0 } satisfies ProjectSyncState

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

        return {
          syncState: pendingCount > 0 ? 'pending' : 'synced',
          pendingCount,
        } satisfies ProjectSyncState
      },
      [projectId],
      DEFAULT_STATE
    ) ?? DEFAULT_STATE
  )
}
