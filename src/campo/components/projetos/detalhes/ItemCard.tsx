import { Icon } from '@/components/ui/icon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Item, ItemCategory, ItemStatus } from '@/shared/db/dexie'

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  extinguisher: 'Extintor',
  emergency_exit: 'Saída de Emergência',
  lighting: 'Iluminação',
  sprinkler: 'Sprinkler',
  alarm: 'Alarme',
  other: 'Outro',
}

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'regular', label: 'Conforme' },
  { value: 'absent', label: 'Ausente' },
]

const STATUS_LABELS: Record<ItemStatus, string> = {
  pending: 'Pendente',
  regular: 'Conforme',
  irregular: 'Irregular',
  absent: 'Ausente',
}

const STATUS_LABELS_LOWER: Record<ItemStatus, string> = {
  pending: 'pendente',
  regular: 'conforme',
  irregular: 'irregular',
  absent: 'ausente',
}

const STATUS_CLASSES: Record<ItemStatus, string> = {
  pending: 'text-safety-amber bg-amber-50 border-amber-200',
  regular: 'text-safety-green bg-emerald-50 border-emerald-200',
  irregular: 'text-red-600 bg-red-50 border-red-200',
  absent: 'text-industrial-500 bg-industrial-100 border-industrial-200',
}

interface Props {
  item: Item
  onStatusChange: (id: string, status: ItemStatus) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onResolveConflict: (id: string, resolution: 'keep_local' | 'use_remote') => void
}

export function ItemCard({ item, onStatusChange, onEdit, onDelete, onResolveConflict }: Props) {
  return (
    <div
      className={cn(
        'hover:border-industrial-300 rounded-xl border-2 transition',
        item.conflictStatus ? 'border-red-400 bg-red-50/50' : 'border-industrial-200 bg-white'
      )}
    >
      {item.conflictStatus && item.conflictRemoteStatus && (
        <div className="flex flex-wrap items-center gap-2 border-b border-red-200 px-3.5 py-2 text-[13px] text-red-700 md:px-4">
          <Icon name="warning" className="text-[16px]" />
          <span className="font-semibold">Conflito de dados remoto. Ação manual necessária.</span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => onResolveConflict(item.id, 'keep_local')}
              className="rounded-md border border-red-300 bg-white px-2 py-1 text-[12px] font-bold text-red-700 transition hover:bg-red-100"
            >
              Manter {STATUS_LABELS_LOWER[item.status]}
            </button>
            <button
              type="button"
              onClick={() => onResolveConflict(item.id, 'use_remote')}
              className="rounded-md bg-red-600 px-2 py-1 text-[12px] font-bold text-white transition hover:bg-red-700"
            >
              Usar {STATUS_LABELS_LOWER[item.conflictRemoteStatus]}
            </button>
          </div>
        </div>
      )}

      {/* Mobile: card inteiro abre o detalhe; status só como badge (escaneável) */}
      <button
        type="button"
        onClick={() => onEdit(item.id)}
        aria-label={`Abrir detalhes de ${item.description}`}
        className="active:bg-industrial-50 flex w-full items-center gap-3 px-3.5 py-3 text-left md:hidden"
      >
        <div className="min-w-0 flex-1">
          <div className="text-industrial-900 text-[15px] leading-snug font-bold wrap-break-word">
            {item.description}
          </div>
          <div className="text-industrial-500 mt-0.5 text-[13px] font-semibold wrap-break-word">
            {CATEGORY_LABELS[item.category]}
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-lg border-2 px-2.5 py-1 text-[12px] font-bold',
            STATUS_CLASSES[item.status]
          )}
        >
          {STATUS_LABELS[item.status]}
        </span>
        <Icon name="chevron_right" className="text-industrial-300 shrink-0 text-[22px]" />
      </button>

      {/* md+: nome abre detalhe; status/remover inline; chevron no hover */}
      <div className="hidden items-center gap-4 px-4 py-3 md:flex">
        <button
          type="button"
          onClick={() => onEdit(item.id)}
          aria-label={`Abrir detalhes de ${item.description}`}
          className="group focus-visible:ring-ring flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-2"
        >
          <div className="min-w-0 flex-1">
            <div className="text-industrial-900 truncate text-[16px] leading-snug font-bold">
              {item.description}
            </div>
            <div className="text-industrial-500 mt-0.5 text-[13px] font-semibold wrap-break-word">
              {CATEGORY_LABELS[item.category]}
            </div>
          </div>
          <Icon
            name="chevron_right"
            className="text-industrial-300 shrink-0 text-[22px] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <Select
            items={STATUS_OPTIONS}
            value={item.status}
            onValueChange={(value) => value && onStatusChange(item.id, value)}
          >
            <SelectTrigger
              aria-label="Status do item"
              className={cn(
                'h-11 w-auto cursor-pointer rounded-lg border-2 px-3 text-[13px] font-bold transition-colors duration-200 outline-none',
                STATUS_CLASSES[item.status]
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={() => onDelete(item.id)}
            aria-label="Remover item"
            className="border-industrial-200 text-industrial-500 flex shrink-0 items-center justify-center rounded-xl border-2 bg-white transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 size-11"
          >
            <Icon name="delete" className="text-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )
}
