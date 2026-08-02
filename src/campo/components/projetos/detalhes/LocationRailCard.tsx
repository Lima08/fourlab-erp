import { Icon } from '@/components/ui/icon'
import type { LocationWithStats } from '@/campo/hooks/useProjectLocations'

interface Props {
  data: LocationWithStats
  isActive: boolean
  railOpen: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

export function LocationRailCard({ data, isActive, railOpen, onSelect, onEdit, onDelete }: Props) {
  const { location, completedLocal, totalLocal, irregularCount, isComplete, icon } = data
  const progressPct = totalLocal === 0 ? 0 : Math.round((completedLocal / totalLocal) * 100)

  return (
    <div
      className={[
        'relative flex w-full items-center rounded-xl border-2 py-2.5 transition-colors duration-150',
        railOpen ? 'gap-2 px-2' : 'justify-center px-0',
        isActive
          ? 'border-industrial-950 bg-industrial-950 text-white'
          : 'text-industrial-700 active:bg-industrial-100 border-transparent bg-white',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onSelect}
        className={[
          'flex min-w-0 flex-1 items-center text-left active:scale-[0.99]',
          railOpen ? 'gap-3' : 'justify-center',
        ].join(' ')}
      >
        <div className="relative flex shrink-0">
          <div
            className={[
              'flex h-9 w-9 items-center justify-center rounded-lg',
              isActive ? 'bg-white/10' : 'bg-industrial-100',
            ].join(' ')}
          >
            <Icon
              name={icon}
              className={['text-[20px]', isActive ? 'text-white' : 'text-industrial-500'].join(' ')}
            />
          </div>
          {irregularCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] leading-none font-bold text-white">
              {irregularCount > 9 ? '9+' : irregularCount}
            </span>
          )}
          {!railOpen && irregularCount > 0 && (
            <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </div>

        <div
          className={[
            'min-w-0 transition-opacity duration-150',
            railOpen ? 'flex-1 opacity-100' : 'pointer-events-none w-0 overflow-hidden opacity-0',
          ].join(' ')}
        >
          <p className="truncate text-[13px] font-extrabold whitespace-nowrap">{location.name}</p>
          <div className="mt-0.5 flex items-center gap-1">
            {isComplete && (
              <Icon
                name="task_alt"
                className={['text-[13px]', isActive ? 'text-white/80' : 'text-safety-green'].join(
                  ' '
                )}
              />
            )}
            <p
              className={[
                'text-[12px] font-bold tabular-nums',
                isActive ? 'text-white/80' : 'text-industrial-400',
              ].join(' ')}
            >
              {completedLocal}/{totalLocal}
            </p>
          </div>
          <div
            className={[
              'mt-1.5 h-1 w-full overflow-hidden rounded-full',
              isActive ? 'bg-white/20' : 'bg-industrial-100',
            ].join(' ')}
          >
            <div
              className={[
                'h-full rounded-full transition-[width] duration-500 ease-in-out',
                isComplete ? 'bg-safety-green' : isActive ? 'bg-white' : 'bg-safety-blue',
              ].join(' ')}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </button>

      {/* Sempre visíveis com rail aberto — tablet não tem hover confiável */}
      {railOpen && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className={[
              'flex h-9 w-9 items-center justify-center rounded-lg transition-colors active:scale-95',
              isActive
                ? 'text-white/80 active:bg-white/10'
                : 'text-industrial-500 active:bg-industrial-200',
            ].join(' ')}
            aria-label={`Editar ${location.name}`}
          >
            <Icon name="edit" className="text-[16px]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className={[
              'flex h-9 w-9 items-center justify-center rounded-lg transition-colors active:scale-95',
              isActive ? 'text-white/80 active:bg-white/10' : 'text-red-500 active:bg-red-50',
            ].join(' ')}
            aria-label={`Excluir ${location.name}`}
          >
            <Icon name="delete" className="text-[16px]" />
          </button>
        </div>
      )}
    </div>
  )
}
