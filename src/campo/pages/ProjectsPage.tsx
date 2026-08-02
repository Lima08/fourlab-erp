import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProjects } from '@/campo/hooks/useProjects'
import { useProjectActions } from '@/campo/hooks/useProjectActions'
import { ProjectListHeader } from '@/campo/components/projetos/ProjectListHeader'
import { ProjectList } from '@/campo/components/projetos/ProjectList'
import { useConnectivity } from '@/shared/hooks/useConnectivity'
import type { DownloadState, Project } from '@/shared/db/dexie'

type ProjectStatus = Project['status']

const PROJECT_STATUSES: ProjectStatus[] = ['pending', 'in_progress', 'completed', 'canceled']
const DOWNLOAD_STATES: DownloadState[] = ['device', 'cloud']

function isProjectStatus(value: string | null): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus)
}

function isDownloadState(value: string | null): value is DownloadState {
  return DOWNLOAD_STATES.includes(value as DownloadState)
}

export default function ProjetosPage() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatus | ''>(() => {
    const param = searchParams.get('status')
    return isProjectStatus(param) ? param : ''
  })
  const [downloadState, setDownloadState] = useState<DownloadState | ''>(() => {
    const param = searchParams.get('downloadState')
    return isDownloadState(param) ? param : ''
  })
  const { projects, counts, isRefreshing } = useProjects(
    search || undefined,
    status || undefined,
    downloadState || undefined
  )
  const { continueInspection, downloadProject } = useProjectActions()
  const { isOnline } = useConnectivity()

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <ProjectListHeader
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        activeStatus={status}
        onDownloadStateChange={setDownloadState}
        activeDownloadState={downloadState}
        counts={counts}
      />
      <ProjectList
        projects={projects}
        isOnline={isOnline}
        onContinue={continueInspection}
        onDownload={downloadProject}
        hasActiveFilters={!!search || !!status || !!downloadState}
        listKey={`${search}|${status}|${downloadState}`}
        isRefreshing={isOnline && isRefreshing}
      />
    </div>
  )
}
