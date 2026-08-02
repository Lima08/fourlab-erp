import { Icon } from '@/components/ui/icon'
import { LocationCard } from './LocationCard'
import type { LocationWithStats } from '@/campo/hooks/useProjectLocations'

interface Props {
  locations: LocationWithStats[] | undefined
  onLocationClick: (locationId: string) => void
  onAddLocation: () => void
  onEditLocation: (locationId: string) => void
}

export function LocationsSection({
  locations,
  onLocationClick,
  onAddLocation,
  onEditLocation,
}: Props) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-industrial-900 flex items-center gap-2 text-lg font-semibold">
          <Icon name="layers" className="text-safety-blue text-[22px]" />
          Localizações
        </h3>
        <button
          onClick={onAddLocation}
          className="text-safety-blue flex items-center gap-1 text-sm font-medium hover:underline"
          aria-label="Adicionar localização"
        >
          <Icon name="add" className="text-[18px]" />
          Adicionar
        </button>
      </div>

      {locations === undefined ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-industrial-100 h-18 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : locations.length === 0 ? (
        <p className="text-industrial-400 text-sm">Nenhuma localização cadastrada</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((data) => (
            <LocationCard
              key={data.location.id}
              data={data}
              onClick={() => onLocationClick(data.location.id)}
              onEdit={() => onEditLocation(data.location.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
