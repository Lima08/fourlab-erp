import { useState } from 'react'
import type { Project } from '@/shared/db/dexie'
import { ProjectCard } from './ProjectCard'
import { ProjectCardSkeleton } from './ProjectCardSkeleton'
import { ProjectsEmptyState } from './ProjectsEmptyState'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

const SKELETON_COUNT = 4

interface Props {
  projects: Project[] | undefined
  isOnline: boolean
  onContinue: (id: string) => void
  onDownload: (id: string) => void
  hasActiveFilters?: boolean
  /** Key de filtro/busca — remount intencional com entrada animada */
  listKey?: string
  /** Refresh de metadados remotos em andamento */
  isRefreshing?: boolean
}

function ProjectListSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-6 md:grid-cols-2"
      role="status"
      aria-live="polite"
      aria-label="Carregando projetos"
    >
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
      <span className="sr-only">Carregando projetos…</span>
    </div>
  )
}

export function ProjectList({
  projects,
  isOnline,
  onContinue,
  onDownload,
  hasActiveFilters,
  listKey = 'all',
  isRefreshing = false,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(10)

  const showSkeletons =
    projects === undefined || (isRefreshing && projects.length === 0 && !hasActiveFilters)

  if (showSkeletons) {
    return <ProjectListSkeleton />
  }

  if (projects.length === 0) {
    if (hasActiveFilters) {
      return (
        <div
          key={listKey}
          className="animate-fade-slide-in text-industrial-500 flex flex-col items-center gap-4 py-16 text-center"
        >
          <Icon name="search_off" className="text-industrial-300 text-[48px]" />
          <p className="text-industrial-700 text-lg font-semibold">Nenhum projeto encontrado</p>
          <p className="text-industrial-500 text-sm">Tente outros termos ou remova os filtros</p>
        </div>
      )
    }
    return <ProjectsEmptyState isOnline={isOnline} />
  }

  const visibleProjects = projects.slice(0, visibleCount)
  const hasMore = visibleCount < projects.length

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Refresh em background: sem banner (evita layout shift); anúncio só para leitores de tela */}
      {isRefreshing && (
        <span className="sr-only" role="status" aria-live="polite">
          Atualizando projetos da nuvem…
        </span>
      )}
      <div key={listKey} className="animate-fade-slide-in grid grid-cols-1 gap-6 md:grid-cols-2">
        {visibleProjects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            isOnline={isOnline}
            onContinue={onContinue}
            onDownload={onDownload}
          />
        ))}
      </div>
      {hasMore && (
        <div className="mt-4 mb-8 flex justify-center">
          <Button
            size="touch"
            onClick={handleLoadMore}
            className="border-industrial-300 bg-industrial-100 text-industrial-900 hover:bg-industrial-200 border px-6"
          >
            Carregar mais projetos
          </Button>
        </div>
      )}
    </div>
  )
}
