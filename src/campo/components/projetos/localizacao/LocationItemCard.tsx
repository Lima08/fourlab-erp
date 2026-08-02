import { Icon } from '@/components/ui/icon'
import type { Item, ItemCategory } from '@/shared/db/dexie'

const CATEGORY_ICONS: Record<ItemCategory, string> = {
  extinguisher: 'fire_extinguisher',
  emergency_exit: 'emergency',
  lighting: 'wb_twilight',
  sprinkler: 'water_drop',
  alarm: 'notifications_active',
  other: 'report_problem',
}

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  extinguisher: 'Extintor',
  emergency_exit: 'Saída de Emergência',
  lighting: 'Iluminação',
  sprinkler: 'Sprinkler',
  alarm: 'Alarme',
  other: 'Geral',
}

interface Props {
  item: Item
  onClick: () => void
}

export function LocationItemCard({ item, onClick }: Props) {
  const icon = CATEGORY_ICONS[item.category] ?? 'report_problem'
  const categoryLabel = CATEGORY_LABELS[item.category] ?? 'Geral'

  return (
    <button
      onClick={onClick}
      className="group border-industrial-100 bg-industrial-50 hover:border-safety-blue/40 flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-white active:scale-95"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="text-industrial-500 group-hover:text-safety-blue flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm transition-colors">
          <Icon name={icon} className="text-[20px]" />
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="bg-industrial-200 text-industrial-600 rounded px-1.5 py-0.5 text-xs font-medium">
              {categoryLabel}
            </span>
          </div>
          <p className="text-industrial-900 truncate text-sm font-medium">{item.description}</p>
        </div>
      </div>
      <Icon
        name="chevron_right"
        className="text-industrial-300 group-hover:text-safety-blue flex-shrink-0 text-[20px]"
      />
    </button>
  )
}
