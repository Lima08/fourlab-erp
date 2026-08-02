import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/dexie'
import type { Item, Project } from '@/shared/db/dexie'
import { computeInspectionStats } from '@/campo/utils/inspectionStats'

export interface ProjectDetailResult {
  project: Project | undefined
  allItems: Item[]
  progressPct: number
  pendingCount: number
  regularCount: number
  irregularCount: number
  absentCount: number
  completedCount: number
  totalCount: number
  isLoading: boolean
}

export function useProjectDetail(projectId: string): ProjectDetailResult {
  const result = useLiveQuery(async () => {
    const project = await db.projects.get(projectId)
    const allItems = await db.items
      .where('projectId')
      .equals(projectId)
      .filter((i) => i.deletedAt === null)
      .toArray()

    const stats = computeInspectionStats(allItems)

    return {
      project,
      allItems,
      progressPct: stats.progressPct,
      pendingCount: stats.pending,
      regularCount: stats.regular,
      irregularCount: stats.irregular,
      completedCount: stats.completed,
      absentCount: stats.absent,
      totalCount: stats.total,
    }
  }, [projectId])

  if (result === undefined) {
    return {
      project: undefined,
      allItems: [],
      progressPct: 0,
      pendingCount: 0,
      regularCount: 0,
      irregularCount: 0,
      absentCount: 0,
      completedCount: 0,
      totalCount: 0,
      isLoading: true,
    }
  }

  return { ...result, isLoading: false }
}
