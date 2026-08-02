import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useProjectDetail } from '@/campo/hooks/useProjectDetail'
import { useProjectSyncState } from '@/campo/hooks/useProjectSyncState'
import { useProjectLocations } from '@/campo/hooks/useProjectLocations'
import { ProjectDetailTopBar } from '@/campo/components/projetos/detalhes/ProjectDetailTopBar'
import { ProjectDetailSkeleton } from '@/campo/components/projetos/detalhes/ProjectDetailSkeleton'
import { ProjectInfoSection } from '@/campo/components/projetos/detalhes/ProjectInfoSection'
import { ProjectInspectionStatus } from '@/campo/components/projetos/detalhes/ProjectInspectionStatus'
import { ItemsListSection } from '@/campo/components/projetos/detalhes/ItemsListSection'
import { LocationsRail } from '@/campo/components/projetos/detalhes/LocationsRail'
import { LocationEditModal } from '@/campo/components/projetos/detalhes/LocationEditModal'
import type { FieldLayoutContext } from '@/campo/FieldLayout'
import type { Location } from '@/shared/db/dexie'
import { db } from '@/shared/db/dexie'
import { toggleInspectionFilter, type InspectionStatusFilter } from '@/campo/utils/inspectionStats'

export default function InspectionPage() {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { setHideHeader } = useOutletContext<FieldLayoutContext>()
  const [statusFilter, setStatusFilter] = useState<InspectionStatusFilter>('all')
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [railOpen, setRailOpen] = useState(false)
  const [locationForModal, setLocationForModal] = useState<Location | undefined>(undefined)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setHideHeader(true)
    return () => setHideHeader(false)
  }, [setHideHeader])

  const {
    project,
    allItems,
    progressPct,
    pendingCount,
    regularCount,
    irregularCount,
    absentCount,
    completedCount,
    totalCount,
    isLoading,
  } = useProjectDetail(projectId)

  const client = useLiveQuery(
    () => (project ? db.clients.get(project.clientId) : undefined),
    [project?.clientId]
  )
  const { syncState, pendingCount: syncPendingCount } = useProjectSyncState(projectId)
  const handleBack = () => navigate('/campo')

  const locations = useProjectLocations(projectId, allItems)

  const activeLocationId =
    selectedLocationId && locations?.some((l) => l.location.id === selectedLocationId)
      ? selectedLocationId
      : null

  const handleFilterChange = (filter: InspectionStatusFilter) => {
    setStatusFilter((current) => toggleInspectionFilter(current, filter))
  }

  const handleSelectLocation = (id: string | null) => {
    setSelectedLocationId(id)
    if (id === null) {
      setStatusFilter('all')
      setSearchQuery('')
    }
  }

  const handleToggleRail = () => {
    setRailOpen((v) => !v)
  }

  const handleOpenAddLocation = () => {
    setLocationForModal(undefined)
    setIsLocationModalOpen(true)
  }

  const handleOpenEditLocation = (id: string) => {
    const loc = locations?.find((l) => l.location.id === id)?.location
    if (loc) {
      setLocationForModal(loc)
      setIsLocationModalOpen(true)
    }
  }

  const handleDeleteLocation = (id: string) => {
    handleOpenEditLocation(id)
  }

  const handleCloseLocationModal = () => {
    setIsLocationModalOpen(false)
    setLocationForModal(undefined)
  }

  if (isLoading) {
    return <ProjectDetailSkeleton onBack={handleBack} />
  }

  if (!project) {
    return (
      <div className="bg-industrial-50 flex min-h-screen flex-col">
        <ProjectDetailTopBar onBack={handleBack} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-industrial-700 text-lg font-semibold">Projeto não encontrado</p>
          <p className="text-industrial-500 text-sm">
            Ele pode ter sido removido deste dispositivo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-industrial-50 flex min-h-screen flex-col">
      <ProjectDetailTopBar onBack={handleBack} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-8 pb-page md:gap-6 md:px-8 md:pt-8">
        <ProjectInfoSection
          project={project}
          clientName={client?.name ?? null}
          syncState={syncState}
          syncPendingCount={syncPendingCount}
        />

        <ProjectInspectionStatus
          progressPct={progressPct}
          completedCount={completedCount}
          totalCount={totalCount}
          regularCount={regularCount}
          pendingCount={pendingCount}
          irregularCount={irregularCount}
          absentCount={absentCount}
          activeFilter={statusFilter}
          onFilterChange={handleFilterChange}
        />

        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <LocationsRail
            locations={locations}
            selectedLocationId={activeLocationId}
            railOpen={railOpen}
            totalItems={totalCount}
            completedItems={completedCount}
            progressPct={progressPct}
            onSelectLocation={handleSelectLocation}
            onToggleRail={handleToggleRail}
            onAddLocation={handleOpenAddLocation}
            onEditLocation={handleOpenEditLocation}
            onDeleteLocation={handleDeleteLocation}
          />

          <div className="w-full min-w-0 flex-1">
            <ItemsListSection
              items={allItems}
              statusFilter={statusFilter}
              projectId={projectId}
              locationId={activeLocationId}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onStatusFilterChange={setStatusFilter}
            />
          </div>
        </div>
      </main>

      {isLocationModalOpen && (
        <LocationEditModal
          projectId={projectId}
          location={locationForModal}
          onClose={handleCloseLocationModal}
        />
      )}
    </div>
  )
}
