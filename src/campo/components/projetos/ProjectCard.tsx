import { useLiveQuery } from 'dexie-react-hooks'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import type { Project } from '@/shared/db/dexie'
import { db } from '@/shared/db/dexie'
import { useProjectSyncState } from '@/campo/hooks/useProjectSyncState'
import { useProjectMenuActions } from '@/campo/hooks/useProjectMenuActions'
import { useProjectDetail } from '@/campo/hooks/useProjectDetail'
import { ProjectStatusBadges } from './ProjectStatusBadges'
import { ProjectProgress } from './ProjectProgress'
import { ProjectCardActions } from './ProjectCardActions'
import { ProjectOptionsMenu } from './ProjectOptionsMenu'
import { ProjectDeleteDialog } from './ProjectDeleteDialog'
import { ProjectSyncConflictsDialog } from './ProjectSyncConflictsDialog'

const cardVariants = cva('relative flex flex-col overflow-hidden rounded-xl', {
  variants: {
    cardType: {
      device: 'bg-white border-2 border-industrial-300 shadow-sm',
      cloud: 'bg-industrial-50/50 border-2 border-dashed border-industrial-400',
    },
  },
})

const RAIL_COLOR: Record<string, string> = {
  pending: 'bg-red-500',
  update_available: 'bg-amber-500',
  synced: 'bg-emerald-500',
}

interface Props {
  project: Project
  isOnline: boolean
  onContinue: (id: string) => void
  onDownload: (id: string) => void
}

export function ProjectCard({ project, isOnline, onContinue, onDownload }: Props) {
  const isCloud = project.downloadState === 'cloud'
  const { syncState, pendingCount } = useProjectSyncState(project.id)
  const client = useLiveQuery(() => db.clients.get(project.clientId), [project.clientId])
  const { completedCount, totalCount } = useProjectDetail(project.id)
  const {
    deleteDialog,
    syncDialog,
    openDeleteDialog,
    confirmDelete,
    closeDeleteDialog,
    openSyncDialog,
    openPullUpdateAction,
    openDownloadMediaAction,
    resolveConflicts,
    isSyncAble,
    closeSyncDialog,
  } = useProjectMenuActions(project, isOnline)

  return (
    <article className={cn(cardVariants({ cardType: project.downloadState }))}>
      {!isCloud && (
        <div
          key={syncState}
          className={cn(
            'absolute inset-y-0 left-0 w-1.5 transition-colors duration-300',
            syncState !== 'synced' && 'animate-state-pulse',
            RAIL_COLOR[syncState]
          )}
        />
      )}

      <div className="flex flex-1 flex-col p-5 md:p-8">
        <div className="flex items-start gap-2">
          <h2 className="text-industrial-900 min-w-0 flex-1 pr-1 text-xl font-bold wrap-break-word">
            {project.name}
          </h2>
          {!isCloud && (
            <ProjectOptionsMenu
              downloadState={project.downloadState}
              syncState={syncState}
              isOnline={isOnline}
              onSyncAction={openSyncDialog}
              onPullUpdate={openPullUpdateAction}
              onDownloadMedia={openDownloadMediaAction}
              onDeleteLocal={openDeleteDialog}
              onDownload={() => onDownload(project.id)}
              triggerClassName="h-11 w-11 shrink-0 rounded-lg border-2 border-industrial-300 bg-white text-industrial-900 hover:bg-industrial-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-400"
            />
          )}
        </div>

        <ProjectStatusBadges
          className="mt-3"
          status={project.status}
          syncState={syncState}
          pendingCount={pendingCount}
          downloadState={project.downloadState}
        />

        <p className="text-industrial-600 mt-3 text-sm wrap-break-word">{project.description}</p>
        {client && (
          <div className="text-industrial-500 mt-2 flex items-center gap-1 text-sm">
            <Icon name="apartment" className="shrink-0 text-[16px]" />
            <span className="wrap-break-word">{client.name}</span>
          </div>
        )}
        <div className="text-industrial-500 mt-2 flex items-start gap-1 text-sm">
          <Icon name="location_on" className="mt-0.5 shrink-0 text-[16px]" />
          <span className="wrap-break-word">
            {`${project.street}, ${project.number} — ${project.city}/${project.state}`}
          </span>
        </div>
        <div className="mt-auto pt-4">
          <ProjectProgress
            completedItems={isCloud ? 0 : completedCount}
            totalItems={isCloud ? 0 : totalCount}
          />
        </div>
      </div>

      <div
        className={cn(
          'border-t-2 p-4',
          isCloud
            ? 'border-industrial-300 border-dashed bg-white'
            : 'border-industrial-200 bg-industrial-50'
        )}
      >
        <ProjectCardActions
          project={project}
          isOnline={isOnline}
          syncState={syncState}
          isSyncAble={isSyncAble}
          onContinue={() => onContinue(project.id)}
          onDownload={() => onDownload(project.id)}
          onUpdate={openSyncDialog}
        />
      </div>

      <ProjectDeleteDialog
        state={deleteDialog}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      />
      <ProjectSyncConflictsDialog
        state={syncDialog}
        onResolve={resolveConflicts}
        onClose={closeSyncDialog}
      />
    </article>
  )
}
