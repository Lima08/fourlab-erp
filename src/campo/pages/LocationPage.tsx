import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useLocationDetail } from '@/campo/hooks/useLocationDetail'
import { LocationDetailTopBar } from '@/campo/components/projetos/localizacao/LocationDetailTopBar'
import { LocationDetailSkeleton } from '@/campo/components/projetos/localizacao/LocationDetailSkeleton'
import { LocationInfoCard } from '@/campo/components/projetos/localizacao/LocationInfoCard'
import { LocationItemsSection } from '@/campo/components/projetos/localizacao/LocationItemsSection'
import { ItemEditModal } from '@/campo/components/projetos/localizacao/ItemEditModal'
import type { FieldLayoutContext } from '@/campo/FieldLayout'

export default function LocationPage() {
  const { projectId = '', locationId = '' } = useParams<{ projectId: string; locationId: string }>()
  const { setHideHeader } = useOutletContext<FieldLayoutContext>()
  const navigate = useNavigate()
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  useEffect(() => {
    setHideHeader(true)
    return () => setHideHeader(false)
  }, [setHideHeader])

  const { location, locationIcon, items, totalLocal, completedLocal, progressPct, isLoading } =
    useLocationDetail(locationId)

  const handleBack = () => navigate(`/campo/vistoria/${projectId}`)

  if (isLoading) {
    return <LocationDetailSkeleton onBack={handleBack} />
  }

  if (!location) {
    return (
      <div className="bg-industrial-50 flex min-h-screen flex-col">
        <LocationDetailTopBar onBack={handleBack} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-industrial-700 text-lg font-semibold">Localização não encontrada</p>
          <p className="text-industrial-500 text-sm">
            Ela pode ter sido removida deste dispositivo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-industrial-50 flex min-h-screen flex-col">
      <LocationDetailTopBar onBack={handleBack} />

      <main className="mx-auto w-full max-w-3xl space-y-6 p-4 pb-12 md:p-8">
        <LocationInfoCard
          location={location}
          locationIcon={locationIcon}
          completedLocal={completedLocal}
          totalLocal={totalLocal}
          progressPct={progressPct}
        />

        <LocationItemsSection items={items} projectId={projectId} onItemClick={setSelectedItemId} />
      </main>

      {selectedItemId && (
        <ItemEditModal
          itemId={selectedItemId}
          projectId={projectId}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </div>
  )
}
