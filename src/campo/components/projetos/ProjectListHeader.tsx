import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'
import type { DownloadState, Project } from '@/shared/db/dexie'
import type { StatusCounts } from '@/campo/hooks/useProjects'

type ProjectStatus = Project['status']

const STATUS_FILTERS: {
  id: ProjectStatus | ''
  label: string
  icon: string
  countKey: keyof StatusCounts
}[] = [
  { id: '', label: 'Todos', icon: 'apps', countKey: 'all' },
  { id: 'pending', label: 'Pendente', icon: 'radio_button_unchecked', countKey: 'pending' },
  { id: 'in_progress', label: 'Em andamento', icon: 'pending', countKey: 'in_progress' },
  { id: 'completed', label: 'Concluído', icon: 'task_alt', countKey: 'completed' },
]

const DOWNLOAD_FILTERS: {
  id: DownloadState
  label: string
  icon: string
  countKey: keyof StatusCounts
}[] = [
  { id: 'device', label: 'No dispositivo', icon: 'tablet_mac', countKey: 'device' },
  { id: 'cloud', label: 'Na nuvem', icon: 'cloud', countKey: 'cloud' },
]

interface FilterBadgeProps<T extends string> {
  id: T
  label: string
  icon: string
  count: number
  active: boolean
  onClick: (id: T) => void
}

function FilterBadge<T extends string>({
  id,
  label,
  icon,
  count,
  active,
  onClick,
}: FilterBadgeProps<T>) {
  return (
    <button
      onClick={() => onClick(id)}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 py-1.5 pr-3.5 pl-3 text-sm font-bold transition-colors duration-150 active:scale-95 ${
        active
          ? 'border-industrial-950 bg-industrial-950 text-white'
          : 'border-industrial-200 text-industrial-600 hover:border-industrial-400 bg-white'
      }`}
    >
      <Icon name={icon} fill={active} className="text-[18px]" />
      {label}
      <span
        className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-extrabold ${
          active ? 'bg-white/20 text-white' : 'bg-industrial-100 text-industrial-500'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

interface Props {
  onSearchChange: (search: string) => void
  onStatusChange: (status: ProjectStatus | '') => void
  activeStatus: ProjectStatus | ''
  onDownloadStateChange: (downloadState: DownloadState | '') => void
  activeDownloadState: DownloadState | ''
  counts: StatusCounts
}

export function ProjectListHeader({
  onSearchChange,
  onStatusChange,
  activeStatus,
  onDownloadStateChange,
  activeDownloadState,
  counts,
}: Props) {
  const [text, setText] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(text), 300)
    return () => clearTimeout(timer)
  }, [text, onSearchChange])

  const handleDownloadStateChange = (id: DownloadState) => {
    onDownloadStateChange(activeDownloadState === id ? '' : id)
  }

  const handleStatusChange = (id: ProjectStatus | '') => {
    onStatusChange(id)
    if (id === '') {
      onDownloadStateChange('')
    }
  }

  return (
    <div className="border-industrial-300 flex flex-col gap-4 border-b pb-6">
      <div>
        <p className="text-industrial-600 mb-1 flex items-center gap-1 text-xs font-semibold tracking-widest uppercase">
          <Icon name="engineering" fill className="text-[16px]" />
          Vistoria Técnica
        </p>
        <h1 className="text-industrial-950 text-4xl font-extrabold tracking-tight md:text-5xl">
          Projetos
        </h1>
      </div>
      <label className="sr-only" htmlFor="project-search">
        Buscar projeto
      </label>
      <div className="relative">
        <Icon
          name="search"
          className="text-industrial-400 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px]"
        />
        <input
          id="project-search"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Buscar por nome..."
          className="border-industrial-200 text-industrial-900 placeholder:text-industrial-400 focus:border-safety-blue focus:ring-safety-blue h-10 w-full rounded-lg border bg-white pr-4 pl-10 text-sm transition-all outline-none focus:ring-1"
        />
      </div>
      <div className="flex flex-col gap-2" role="group" aria-label="Filtrar projetos">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
          {STATUS_FILTERS.map((f) => (
            <FilterBadge
              key={f.id === '' ? 'all' : f.id}
              id={f.id}
              label={f.label}
              icon={f.icon}
              count={counts[f.countKey]}
              active={
                f.id === ''
                  ? activeStatus === '' && activeDownloadState === ''
                  : activeStatus === f.id
              }
              onClick={handleStatusChange}
            />
          ))}
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
          {DOWNLOAD_FILTERS.map((f) => (
            <FilterBadge
              key={f.id}
              id={f.id}
              label={f.label}
              icon={f.icon}
              count={counts[f.countKey]}
              active={activeDownloadState === f.id}
              onClick={handleDownloadStateChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
