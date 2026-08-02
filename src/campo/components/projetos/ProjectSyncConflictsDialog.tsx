import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { RemoteOnlyItem } from '@/shared/services/sync/syncService'
import type { SyncDialogState } from '@/campo/hooks/useProjectMenuActions'

const CATEGORY_LABELS: Record<string, string> = {
  extinguisher: 'Extintor',
  emergency_exit: 'Saída de emergência',
  lighting: 'Iluminação',
  sprinkler: 'Sprinkler',
  alarm: 'Alarme',
  other: 'Outro',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  regular: 'Regular',
  irregular: 'Irregular',
  absent: 'Ausente',
}

interface Props {
  state: SyncDialogState
  onResolve: (resolution: 'keep_local' | 'pull_remote', selectedIds?: string[]) => void
  onClose: () => void
}

function ConflictList({
  items,
  selected,
  onToggle,
}: {
  items: RemoteOnlyItem[]
  selected: Set<string>
  onToggle: (id: string) => void
}) {
  return (
    <ul className="border-border divide-border max-h-48 divide-y overflow-y-auto rounded-md border">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2 px-3 py-2 text-xs">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={selected.has(item.id)}
            onChange={() => onToggle(item.id)}
            aria-label={`Manter ${item.description}`}
          />
          <span className="text-foreground flex-1">{item.description}</span>
          <span className="text-muted-foreground shrink-0">
            {CATEGORY_LABELS[item.category] ?? item.category} ·{' '}
            {STATUS_LABELS[item.status] ?? item.status}
          </span>
        </li>
      ))}
    </ul>
  )
}

function ConflictsBody({
  items,
  onResolve,
}: {
  items: RemoteOnlyItem[]
  onResolve: (resolution: 'keep_local' | 'pull_remote', selectedIds?: string[]) => void
}) {
  const [selected, setSelected] = useState(() => new Set(items.map((i) => i.id)))
  const count = items.length
  const discardCount = count - selected.size

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Diferenças encontradas</DialogTitle>
        <DialogDescription>
          {count} item{count !== 1 ? 's' : ''} no servidor não
          {count !== 1 ? ' existem' : ' existe'} localmente. Marque os que deseja manter — os demais
          serão excluídos permanentemente do servidor.
        </DialogDescription>
      </DialogHeader>
      {count > 0 && <ConflictList items={items} selected={selected} onToggle={toggle} />}
      {discardCount > 0 && (
        <p className="text-destructive text-xs font-semibold">
          {discardCount} item{discardCount !== 1 ? 's' : ''} não marcado
          {discardCount !== 1 ? 's' : ''} será{discardCount !== 1 ? 'ão' : ''} excluído
          {discardCount !== 1 ? 's' : ''} do servidor.
        </p>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={() => onResolve('keep_local', Array.from(selected))}>
          Confirmar seleção
        </Button>
        <Button onClick={() => onResolve('pull_remote')}>Baixar tudo do servidor</Button>
      </DialogFooter>
    </>
  )
}

export function ProjectSyncConflictsDialog({ state, onResolve, onClose }: Props) {
  const open = state.phase === 'conflicts'
  const items = open ? state.items : []
  const selectionKey = items.map((i) => i.id).join(',')

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false}>
        {open && <ConflictsBody key={selectionKey} items={items} onResolve={onResolve} />}
      </DialogContent>
    </Dialog>
  )
}
