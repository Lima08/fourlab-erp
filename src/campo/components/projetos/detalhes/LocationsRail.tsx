import { Icon } from '@/components/ui/icon'
import { AllItemsRailCard } from './AllItemsRailCard'
import { LocationRailCard } from './LocationRailCard'
import type { LocationWithStats } from '@/campo/hooks/useProjectLocations'

interface Props {
  locations: LocationWithStats[] | undefined
  selectedLocationId: string | null
  railOpen: boolean
  totalItems: number
  completedItems: number
  progressPct: number
  onSelectLocation: (id: string | null) => void
  onToggleRail: () => void
  onAddLocation: () => void
  onEditLocation: (id: string) => void
  onDeleteLocation: (id: string) => void
}

export function LocationsRail({
  locations,
  selectedLocationId,
  railOpen,
  totalItems,
  completedItems,
  progressPct,
  onSelectLocation,
  onToggleRail,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
}: Props) {
  const locs = locations ?? []

  return (
    <>
      <aside
        className={[
          'hidden shrink-0 flex-col overflow-hidden md:flex',
          'sticky top-4 max-h-[calc(100vh-6rem)] overflow-y-auto',
          'transition-[width] duration-300 ease-in-out',
          railOpen ? 'w-80' : 'w-18',
        ].join(' ')}
      >
        <div className="border-industrial-200 flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-white">
          <div
            className={[
              'border-industrial-100 flex shrink-0 items-center border-b py-3',
              railOpen ? 'justify-between px-3' : 'justify-center px-0',
            ].join(' ')}
          >
            <div
              className={[
                'overflow-hidden transition-opacity duration-150',
                railOpen ? 'opacity-100' : 'pointer-events-none w-0 opacity-0',
              ].join(' ')}
            >
              <span className="text-industrial-500 pl-1 text-[13px] font-extrabold tracking-wide whitespace-nowrap uppercase">
                Localizações
              </span>
            </div>
            <button
              onClick={onToggleRail}
              className="text-industrial-500 hover:bg-industrial-100 flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors"
              aria-label={railOpen ? 'Recolher rail' : 'Expandir rail'}
            >
              <Icon name={railOpen ? 'chevron_left' : 'chevron_right'} className="text-[22px]" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
            <AllItemsRailCard
              totalItems={totalItems}
              completedItems={completedItems}
              progressPct={progressPct}
              isActive={selectedLocationId === null}
              railOpen={railOpen}
              onClick={() => onSelectLocation(null)}
            />

            {locs.map((loc) => (
              <LocationRailCard
                key={loc.location.id}
                data={loc}
                isActive={selectedLocationId === loc.location.id}
                railOpen={railOpen}
                onSelect={() => onSelectLocation(loc.location.id)}
                onEdit={() => onEditLocation(loc.location.id)}
                onDelete={() => onDeleteLocation(loc.location.id)}
              />
            ))}

            <button
              onClick={onAddLocation}
              className={[
                'border-industrial-200 flex w-full items-center rounded-xl border-2 border-dashed',
                'py-2.5 text-left transition-colors',
                'text-industrial-400 hover:border-industrial-400 hover:text-industrial-900',
                railOpen ? 'gap-3 px-2' : 'justify-center px-0',
              ].join(' ')}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon name="add" className="text-[20px]" />
              </div>
              <span
                className={[
                  'text-[13px] font-bold whitespace-nowrap transition-opacity duration-150',
                  railOpen ? 'opacity-100' : 'pointer-events-none w-0 overflow-hidden opacity-0',
                ].join(' ')}
              >
                Adicionar localização
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile: chips scrollam; editar (se local ativo) e "+" ficam fixos à direita */}
      <div className="flex w-full min-w-0 items-center gap-2 md:hidden">
        <div className="scrollbar-hide flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
          <MobileChip
            icon="apps"
            label="Todos"
            isActive={selectedLocationId === null}
            onClick={() => onSelectLocation(null)}
          />
          {locs.map((loc) => (
            <MobileChip
              key={loc.location.id}
              icon={loc.icon}
              label={loc.location.name}
              count={loc.totalLocal}
              isActive={selectedLocationId === loc.location.id}
              onClick={() => onSelectLocation(loc.location.id)}
            />
          ))}
        </div>
        {selectedLocationId !== null && (
          <button
            type="button"
            onClick={() => onEditLocation(selectedLocationId)}
            className="border-industrial-300 text-industrial-700 hover:border-industrial-500 hover:text-industrial-900 flex shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors active:scale-95 size-10"
            aria-label="Editar localização"
          >
            <Icon name="edit" className="text-[18px]" />
          </button>
        )}
        <button
          type="button"
          onClick={onAddLocation}
          className="border-industrial-300 text-industrial-600 hover:border-industrial-500 hover:text-industrial-900 flex shrink-0 items-center justify-center rounded-full border-2 border-dashed bg-white transition-colors active:scale-95 size-10"
          aria-label="Adicionar localização"
        >
          <Icon name="add" className="text-[20px]" />
        </button>
      </div>
    </>
  )
}

function MobileChip({
  icon,
  label,
  count,
  isActive,
  onClick,
}: {
  icon: string
  label: string
  count?: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-3',
        'text-sm font-bold transition-colors',
        isActive
          ? 'border-industrial-950 bg-industrial-950 text-white'
          : 'border-industrial-200 text-industrial-700 hover:border-industrial-400 bg-white',
      ].join(' ')}
    >
      <Icon name={icon} className="text-[16px]" />
      <span className="max-w-24 truncate">{label}</span>
      {count !== undefined && (
        <span
          className={[
            'text-[12px] tabular-nums',
            isActive ? 'text-white/70' : 'text-industrial-400',
          ].join(' ')}
        >
          {count}
        </span>
      )}
    </button>
  )
}
