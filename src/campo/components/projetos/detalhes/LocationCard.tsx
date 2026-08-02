import { Icon } from '@/components/ui/icon'
import type { LocationWithStats } from '@/campo/hooks/useProjectLocations'

interface Props {
  data: LocationWithStats
  onClick: () => void
  onEdit: () => void
}

export function LocationCard({ data, onClick, onEdit }: Props) {
  const { location, completedLocal, totalLocal, isComplete, icon } = data

  return (
    <div className="group border-industrial-200 hover:border-safety-blue/50 flex w-full items-center justify-between rounded-xl border bg-white p-4 transition-colors">
      <button
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-95"
      >
        <div className="bg-industrial-100 text-industrial-500 group-hover:bg-industrial-200 group-hover:text-safety-blue flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors">
          <Icon name={icon} className="text-[22px]" />
        </div>
        <div className="min-w-0">
          <h4 className="text-industrial-900 text-sm font-medium">{location.name}</h4>
          {isComplete ? (
            <p className="text-safety-green flex items-center gap-1 text-xs font-medium">
              <Icon name="check_circle" fill className="text-[14px]" />
              {completedLocal} / {totalLocal} itens
            </p>
          ) : (
            <p className="text-industrial-500 text-xs">
              {completedLocal} / {totalLocal} itens
            </p>
          )}
        </div>
      </button>

      <div className="ml-2 flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          aria-label={`Editar ${location.name}`}
          className="text-industrial-400 hover:bg-industrial-100 hover:text-safety-blue flex size-9 items-center justify-center rounded-full transition-colors"
        >
          <Icon name="edit" className="text-[18px]" />
        </button>
        <Icon
          name="chevron_right"
          className="text-industrial-400 group-hover:text-safety-blue text-[22px]"
        />
      </div>
    </div>
  )
}
