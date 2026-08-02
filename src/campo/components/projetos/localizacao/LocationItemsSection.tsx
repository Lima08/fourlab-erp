import { Icon } from '@/components/ui/icon'
import type { Item } from '@/shared/db/dexie'
import { LocationItemsGroup } from './LocationItemsGroup'

interface ItemGroups {
  pending: Item[]
  irregular: Item[]
  regular: Item[]
  absent: Item[]
}

interface Props {
  items: ItemGroups
  projectId: string
  onItemClick: (itemId: string) => void
}

export function LocationItemsSection({ items, projectId, onItemClick }: Props) {
  const total =
    items.pending.length + items.irregular.length + items.regular.length + items.absent.length

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-industrial-900 text-lg font-semibold">Itens para Verificação</h3>
        <button
          disabled
          className="text-industrial-300 flex h-10 cursor-not-allowed items-center gap-2 rounded-lg px-4 text-sm font-medium"
          aria-label="Adicionar item (indisponível)"
        >
          <Icon name="add" className="text-[20px]" />
          Adicionar Item
        </button>
      </div>

      {total === 0 ? (
        <div className="border-industrial-200 flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
          <Icon name="inventory_2" className="text-industrial-300 mb-3 text-[40px]" />
          <p className="text-industrial-500 text-sm font-medium">Nenhum item cadastrado</p>
          <p className="text-industrial-400 mt-1 text-xs">
            Os itens desta localização aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <LocationItemsGroup
            status="pending"
            items={items.pending}
            projectId={projectId}
            onItemClick={onItemClick}
          />
          <LocationItemsGroup
            status="irregular"
            items={items.irregular}
            projectId={projectId}
            onItemClick={onItemClick}
          />
          <LocationItemsGroup
            status="regular"
            items={items.regular}
            projectId={projectId}
            onItemClick={onItemClick}
          />
          <LocationItemsGroup
            status="absent"
            items={items.absent}
            projectId={projectId}
            onItemClick={onItemClick}
          />
        </div>
      )}
    </section>
  )
}
