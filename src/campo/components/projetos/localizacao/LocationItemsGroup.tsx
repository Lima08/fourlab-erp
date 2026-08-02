import { Icon } from '@/components/ui/icon'
import type { Item, ItemStatus } from '@/shared/db/dexie'
import { LocationItemCard } from './LocationItemCard'

interface GroupConfig {
  label: string
  badgeClass: string
  borderClass: string
  defaultOpen: boolean
}

const GROUP_CONFIG: Record<ItemStatus, GroupConfig> = {
  pending: {
    label: 'Pendentes',
    badgeClass: 'bg-amber-100 text-amber-800',
    borderClass: 'border-amber-300',
    defaultOpen: true,
  },
  irregular: {
    label: 'Irregulares',
    badgeClass: 'bg-red-100 text-red-800',
    borderClass: 'border-red-300',
    defaultOpen: true,
  },
  regular: {
    label: 'Regulares',
    badgeClass: 'bg-green-100 text-green-800',
    borderClass: 'border-industrial-200',
    defaultOpen: false,
  },
  absent: {
    label: 'Ausentes',
    badgeClass: 'bg-industrial-100 text-industrial-600',
    borderClass: 'border-industrial-200',
    defaultOpen: false,
  },
}

interface Props {
  status: ItemStatus
  items: Item[]
  projectId: string
  onItemClick: (itemId: string) => void
}

export function LocationItemsGroup({ status, items, onItemClick }: Props) {
  if (items.length === 0) return null

  const config = GROUP_CONFIG[status]

  return (
    <details
      className={`group overflow-hidden rounded-lg border bg-white ${config.borderClass}`}
      open={config.defaultOpen}
    >
      <summary className="hover:bg-industrial-50 flex cursor-pointer list-none items-center justify-between p-4 transition-colors">
        <div className="flex items-center gap-3">
          <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${config.badgeClass}`}>
            {config.label} ({items.length})
          </span>
        </div>
        <Icon
          name="expand_more"
          className="text-industrial-400 text-[22px] transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-industrial-100 space-y-2 border-t p-4 pt-3">
        {items.map((item) => (
          <LocationItemCard key={item.id} item={item} onClick={() => onItemClick(item.id)} />
        ))}
      </div>
    </details>
  )
}
