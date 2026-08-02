import { Icon } from '@/components/ui/icon'
import type { Location } from '@/shared/db/dexie'

const TYPE_LABELS: Record<Location['type'], string> = {
  building: 'Prédio',
  floor: 'Pavimento',
  room: 'Sala / Ambiente',
  outdoor: 'Área Externa',
  other: 'Outro',
}

interface StatusConfig {
  label: string
  icon: string
  className: string
}

function getStatusConfig(completedLocal: number, totalLocal: number): StatusConfig {
  if (totalLocal === 0)
    return { label: 'Sem itens', icon: 'inbox', className: 'bg-industrial-100 text-industrial-500' }
  if (completedLocal === totalLocal)
    return { label: 'Concluída', icon: 'check_circle', className: 'bg-green-100 text-green-700' }
  if (completedLocal === 0)
    return {
      label: 'Não iniciada',
      icon: 'radio_button_unchecked',
      className: 'bg-industrial-100 text-industrial-500',
    }
  return { label: 'Em andamento', icon: 'pending', className: 'bg-amber-100 text-amber-700' }
}

interface Props {
  location: Location
  locationIcon: string
  completedLocal: number
  totalLocal: number
  progressPct: number
}

export function LocationInfoCard({
  location,
  locationIcon,
  completedLocal,
  totalLocal,
  progressPct,
}: Props) {
  const status = getStatusConfig(completedLocal, totalLocal)

  return (
    <section className="border-industrial-200 overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-industrial-100 text-industrial-500 flex size-12 flex-shrink-0 items-center justify-center rounded-xl">
              <Icon name={locationIcon} className="text-[26px]" />
            </div>
            <div>
              <p className="text-industrial-400 mb-0.5 text-xs font-medium tracking-wider uppercase">
                {TYPE_LABELS[location.type] ?? 'Local'}
              </p>
              <h2 className="text-industrial-900 text-xl font-bold">{location.name}</h2>
            </div>
          </div>
          <span
            className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${status.className}`}
          >
            <Icon name={status.icon} fill className="text-[16px]" />
            {status.label}
          </span>
        </div>

        {totalLocal > 0 && (
          <div className="border-industrial-100 mt-4 border-t pt-4">
            <div className="text-industrial-500 mb-1.5 flex items-center justify-between text-xs">
              <span>
                {completedLocal} / {totalLocal} itens vistoriados
              </span>
              <span className="font-semibold">{progressPct}%</span>
            </div>
            <div className="bg-industrial-100 h-2 overflow-hidden rounded-full">
              <div
                className="bg-safety-blue h-full rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
