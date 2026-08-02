import { Icon } from '@/components/ui/icon'
import { ProjectStatusBadges } from '@/campo/components/projetos/ProjectStatusBadges'
import { formatProjectAddress, formatProjectDate } from '@/campo/utils/inspectionStats'
import type { SyncState } from '@/campo/hooks/useProjectSyncState'
import type { Project } from '@/shared/db/dexie'

interface Props {
  project: Project
  clientName: string | null
  syncState: SyncState
  syncPendingCount?: number
}

export function ProjectInfoSection({ project, clientName, syncState, syncPendingCount }: Props) {
  const createdAt = project.createdAt ?? project.downloadedAt

  return (
    <section className="border-industrial-200 rounded-2xl border-2 bg-white p-6 md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-industrial-900 text-2xl leading-tight font-extrabold tracking-tight md:text-3xl">
            {project.name}
          </h2>
        </div>
        <ProjectStatusBadges
          className="shrink-0"
          status={project.status}
          syncState={syncState}
          pendingCount={syncPendingCount}
          downloadState={project.downloadState}
        />
      </div>

      <div className="mt-4 space-y-2">
        {clientName ? (
          <div className="text-industrial-700 flex items-start gap-2 text-sm font-semibold">
            <Icon name="apartment" className="text-industrial-400 mt-0.5 shrink-0 text-[20px]" />
            <span>{clientName}</span>
          </div>
        ) : null}
        <div className="text-industrial-700 flex items-start gap-2 text-sm font-medium">
          <Icon name="location_on" className="text-industrial-400 mt-0.5 shrink-0 text-[20px]" />
          <span>{formatProjectAddress(project)}</span>
        </div>
        <div className="text-industrial-700 flex items-start gap-2 text-sm font-medium">
          <Icon name="calendar_today" className="text-industrial-400 mt-0.5 shrink-0 text-[20px]" />
          <span>Criado em {formatProjectDate(createdAt)}</span>
        </div>
      </div>

      {project.description ? (
        <div className="border-industrial-100 mt-6 border-t-2 pt-5">
          <div className="text-industrial-500 mb-2 flex items-center gap-2 text-[13px] font-extrabold tracking-wide uppercase">
            <Icon name="description" className="text-industrial-400 text-[18px]" />
            Observações gerais
          </div>
          <p className="text-industrial-700 text-[15px] leading-relaxed">{project.description}</p>
        </div>
      ) : null}
    </section>
  )
}
