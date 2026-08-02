import { useState } from 'react'
import { toast } from 'sonner'
import { useLiveQuery } from 'dexie-react-hooks'
import { Icon } from '@/components/ui/icon'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ItemCard } from './ItemCard'
import { ItemEditModal } from '../localizacao/ItemEditModal'
import { db } from '@/shared/db/dexie'
import { enqueueItemUpdate, enqueueItemDelete } from '@/shared/services/sync/queueProcessor'
import { recomputeProjectProgress } from '@/campo/utils/inspectionStats'
import type { Item, ItemStatus, Location } from '@/shared/db/dexie'
import type { InspectionStatusFilter } from '@/campo/utils/inspectionStats'

const LOC_ICONS: Record<Location['type'], string> = {
  floor: 'floor',
  building: 'apartment',
  room: 'meeting_room',
  outdoor: 'outdoor_grill',
  other: 'place',
}

interface Props {
  items: Item[]
  statusFilter: InspectionStatusFilter
  projectId: string
  locationId?: string | null
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onStatusFilterChange: (filter: InspectionStatusFilter) => void
}

export function ItemsListSection({
  items,
  statusFilter,
  projectId,
  locationId,
  searchQuery,
  onSearchQueryChange,
  onStatusFilterChange,
}: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [itemModal, setItemModal] = useState<
    | { mode: 'edit'; itemId: string }
    | { mode: 'new'; itemId: string; locationId: string | null }
    | null
  >(null)

  const locations = useLiveQuery(
    () => db.locations.where('projectId').equals(projectId).sortBy('name'),
    [projectId]
  )

  const q = searchQuery.trim().toLowerCase()

  const filtered = items.filter((item) => {
    if (locationId != null && item.locationId !== locationId) return false
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (q && !item.description.toLowerCase().includes(q)) return false
    return true
  })

  const totalVisible = filtered.length

  const groups: { locId: string | null; name: string; icon: string; items: Item[] }[] = []

  const isLocationFiltered = locationId != null

  if (!isLocationFiltered && locations !== undefined) {
    const byLoc = new Map<string | null, Item[]>()
    for (const item of filtered) {
      const key = item.locationId ?? null
      const arr = byLoc.get(key) ?? []
      arr.push(item)
      byLoc.set(key, arr)
    }

    for (const loc of locations) {
      const locItems = byLoc.get(loc.id) ?? []
      if (locItems.length > 0 || (statusFilter === 'all' && !q)) {
        groups.push({
          locId: loc.id,
          name: loc.name,
          icon: LOC_ICONS[loc.type] ?? 'place',
          items: locItems,
        })
      }
    }

    const noLocItems = byLoc.get(null) ?? []
    if (noLocItems.length > 0) {
      groups.push({ locId: null, name: 'Sem localização', icon: 'help_outline', items: noLocItems })
    }
  }

  const selectedLocation =
    isLocationFiltered && locations !== undefined
      ? (locations.find((l) => l.id === locationId) ?? null)
      : null

  async function handleStatusChange(id: string, status: ItemStatus) {
    await db.items.update(id, { status, updatedAt: new Date(), syncedAt: null })
    const updated = await db.items.get(id)
    if (updated && !updated.deletedAt) {
      await enqueueItemUpdate(updated)
    }
    await recomputeProjectProgress(projectId)
  }

  async function handleResolveConflict(id: string, resolution: 'keep_local' | 'use_remote') {
    const item = await db.items.get(id)
    if (!item) return

    if (resolution === 'use_remote' && item.conflictRemoteStatus) {
      await db.items.update(id, {
        status: item.conflictRemoteStatus,
        conflictStatus: false,
        conflictRemoteStatus: null,
      })
    } else {
      await db.items.update(id, {
        conflictStatus: false,
        conflictRemoteStatus: null,
        updatedAt: new Date(),
        syncedAt: null,
      })
      const updated = await db.items.get(id)
      if (updated && !updated.deletedAt) {
        await enqueueItemUpdate(updated)
      }
    }

    await recomputeProjectProgress(projectId)
  }

  async function handleDeleteConfirm() {
    if (!pendingDeleteId) return
    const id = pendingDeleteId
    setPendingDeleteId(null)
    await db.items.update(id, { deletedAt: new Date() })
    await enqueueItemDelete(id)
    await recomputeProjectProgress(projectId)
    toast.success('Item removido')
  }

  function handleEdit(id: string) {
    setItemModal({ mode: 'edit', itemId: id })
  }

  function handleAddItem(locId?: string) {
    setItemModal({ mode: 'new', itemId: crypto.randomUUID(), locationId: locId ?? null })
  }

  const pendingDeleteItem = pendingDeleteId ? items.find((i) => i.id === pendingDeleteId) : null

  return (
    <section>
      {/* toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Icon
            name="search"
            className="text-industrial-400 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[20px]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar item por nome..."
            className="border-industrial-200 text-industrial-900 placeholder:text-industrial-400 focus:border-safety-blue focus:ring-safety-blue h-10 w-full rounded-lg border bg-white pr-4 pl-10 text-sm transition-all outline-none focus:ring-1"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="text-industrial-400 hover:bg-industrial-100 absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          )}
        </div>
      </div>

      {/* counter */}
      {!selectedLocation && (
        <p className="text-industrial-500 mb-3 text-[13px] font-semibold">
          {totalVisible} {totalVisible === 1 ? 'item' : 'itens'}
          {statusFilter !== 'all' || q ? ' encontrados' : ' no total'}
        </p>
      )}

      {/* empty state */}
      {locations !== undefined && totalVisible === 0 && (
        <div className="border-industrial-200 flex flex-col items-center rounded-2xl border-2 border-dashed bg-white px-6 py-14 text-center">
          <Icon
            name={q ? 'search_off' : 'inventory'}
            className="text-industrial-300 mb-3 text-[48px]"
          />
          <h3 className="text-industrial-900 text-lg font-extrabold">Nenhum item encontrado</h3>

          <p className="text-industrial-500 mt-1 max-w-sm text-[14px]">
            {q
              ? `Nada corresponde a "${searchQuery.trim()}".`
              : statusFilter !== 'all'
                ? 'Nenhum item com esse status.'
                : 'Adicione o primeiro item do projeto.'}
          </p>

          <button
            onClick={() => handleAddItem()}
            className="bg-industrial-950 hover:bg-industrial-800 mt-4 flex h-10 items-center rounded-lg px-3 text-sm font-bold text-white transition active:scale-95"
          >
            <Icon name="add" className="text-[18px]" />
            Adicionar item
          </button>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                onSearchQueryChange('')
                onStatusFilterChange('all')
              }}
              className="bg-industrial-950 hover:bg-industrial-800 mt-4 h-10 rounded-lg px-5 text-sm font-bold text-white transition active:scale-95"
            >
              Limpar busca
            </button>
          )}
        </div>
      )}

      {/* flat list — single location selected */}
      {isLocationFiltered && filtered.length > 0 && (
        <div
          key={`${locationId ?? 'all'}|${statusFilter}|${searchQuery}`}
          className="animate-fade-slide-in space-y-2.5"
        >
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit}
              onDelete={setPendingDeleteId}
              onResolveConflict={handleResolveConflict}
            />
          ))}
        </div>
      )}

      {/* groups */}
      {!isLocationFiltered && groups.length > 0 && (
        <div
          key={`groups|${statusFilter}|${searchQuery}`}
          className="animate-fade-slide-in space-y-6"
        >
          {groups.map(({ locId, name, icon, items: groupItems }) => (
            <div key={locId ?? '__none__'}>
              <div className="mb-2 flex items-center gap-2 px-0.5">
                <Icon name={icon} className="text-industrial-400 text-[18px]" />
                <h4 className="text-industrial-500 text-[14px] font-extrabold tracking-wide uppercase">
                  {name}
                </h4>
                <span className="text-industrial-400 text-[13px] font-bold tabular-nums">
                  {groupItems.length}
                </span>
                <div className="bg-industrial-200 ml-1 h-px flex-1" />
                <button
                  onClick={() => handleAddItem(locId ?? undefined)}
                  className="text-industrial-500 hover:text-industrial-900 flex items-center gap-1 text-[13px] font-bold"
                >
                  <Icon name="add" className="text-[16px]" /> Item
                </button>
              </div>

              <div className="space-y-2.5">
                {groupItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onEdit={handleEdit}
                    onDelete={setPendingDeleteId}
                    onResolveConflict={handleResolveConflict}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* delete confirmation dialog */}
      <Dialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <DialogContent className="mx-4 max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-industrial-900 text-lg font-extrabold">Remover item?</h2>
          {pendingDeleteItem && (
            <p className="text-industrial-600 mt-2 text-[14px]">
              <span className="text-industrial-900 font-bold">
                "{pendingDeleteItem.description}"
              </span>{' '}
              será removido desta vistoria.
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <DialogClose>
              <Button variant="outline" size="sm">
                Cancelar
              </Button>
            </DialogClose>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirm}>
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {itemModal && (
        <ItemEditModal
          itemId={itemModal.itemId}
          projectId={projectId}
          isNew={itemModal.mode === 'new'}
          initialLocationId={itemModal.mode === 'new' ? itemModal.locationId : null}
          onClose={() => setItemModal(null)}
          onDelete={
            itemModal.mode === 'edit'
              ? () => {
                  const id = itemModal.itemId
                  setItemModal(null)
                  setPendingDeleteId(id)
                }
              : undefined
          }
        />
      )}
    </section>
  )
}
