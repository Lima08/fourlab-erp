import { db } from '@/shared/db/dexie'
import type { Item, Project } from '@/shared/db/dexie'
import { enqueueProjectUpdate } from '@/shared/services/sync/queueProcessor'

export type InspectionStatusFilter = 'all' | 'regular' | 'pending' | 'irregular' | 'absent'

export interface InspectionStats {
  total: number
  completed: number
  pending: number
  regular: number
  irregular: number
  absent: number
  progressPct: number
}

export function getActiveItems(items: Item[]): Item[] {
  return items.filter((i) => i.deletedAt === null)
}

export function computeInspectionStats(items: Item[]): InspectionStats {
  const active = getActiveItems(items)
  const total = active.length
  const pending = active.filter((i) => i.status === 'pending').length
  const irregular = active.filter((i) => i.status === 'irregular').length
  const regular = active.filter((i) => i.status === 'regular').length
  const absent = active.filter((i) => i.status === 'absent').length
  const completed = total - pending
  const progressPct = total === 0 ? 0 : Math.round((completed / total) * 100)

  return { total, completed, pending, irregular, regular, absent, progressPct }
}

export function deriveProjectStatus(
  stats: Pick<InspectionStats, 'completed' | 'total'>
): Project['status'] {
  const { completed, total } = stats
  if (total === 0) return 'pending'
  if (completed === 0) return 'pending'
  if (completed === total) return 'completed'
  return 'in_progress'
}

export async function recomputeProjectProgress(projectId: string): Promise<void> {
  const project = await db.projects.get(projectId)
  if (!project) return

  const items = await db.items
    .where('projectId')
    .equals(projectId)
    .filter((i) => i.deletedAt === null)
    .toArray()

  const stats = computeInspectionStats(items)
  const nextStatus = project.status === 'canceled' ? 'canceled' : deriveProjectStatus(stats)

  const statusChanged = nextStatus !== project.status
  const countersChanged =
    stats.completed !== project.completedItems || stats.total !== project.totalItems

  if (!statusChanged && !countersChanged) return

  await db.projects.update(projectId, {
    status: nextStatus,
    completedItems: stats.completed,
    totalItems: stats.total,
  })

  if (statusChanged && nextStatus !== 'canceled') {
    await enqueueProjectUpdate(projectId, nextStatus)
  }
}

export function toggleInspectionFilter(
  current: InspectionStatusFilter,
  next: InspectionStatusFilter
): InspectionStatusFilter {
  return current === next ? 'all' : next
}

export function formatProjectDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatProjectAddress(project: {
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
}): string {
  const streetLine = `${project.street}, ${project.number} — ${project.neighborhood}`
  return `${streetLine} · ${project.city} / ${project.state}`
}
