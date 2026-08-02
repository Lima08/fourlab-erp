import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { DeleteDialogState } from '@/campo/hooks/useProjectMenuActions'

interface Props {
  state: DeleteDialogState
  onConfirm: () => void
  onCancel: () => void
}

function dialogContent(state: DeleteDialogState): { title: string; description: string } {
  if (state.phase === 'checking') {
    return { title: 'Verificando...', description: 'Consultando estado do projeto no servidor.' }
  }
  if (state.phase === 'ready' && !state.existsRemotely) {
    return {
      title: 'Projeto não encontrado no servidor',
      description:
        'Este projeto não existe no servidor. Ao deletar localmente, todos os dados serão perdidos permanentemente e não poderão ser recuperados.',
    }
  }
  if (state.phase === 'ready' && state.hasPendingChanges) {
    return {
      title: 'Existem alterações não sincronizadas',
      description:
        'Há dados preenchidos localmente que ainda não foram enviados ao servidor. Se continuar, essas informações serão perdidas permanentemente.',
    }
  }
  return {
    title: 'Remover do dispositivo',
    description:
      'O projeto está salvo e atualizado no servidor. Ele será removido deste dispositivo e poderá ser baixado novamente quando necessário.',
  }
}

const isUnsafe = (state: DeleteDialogState) =>
  state.phase === 'ready' && (!state.existsRemotely || state.hasPendingChanges)

export function ProjectDeleteDialog({ state, onConfirm, onCancel }: Props) {
  const open = state.phase !== 'idle'
  const checking = state.phase === 'checking'
  const deleting = state.phase === 'deleting'
  const { title, description } = dialogContent(state)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="touch"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={checking || deleting}
          >
            Cancelar
          </Button>
          <Button
            size="touch"
            className="w-full bg-red-600 text-white hover:bg-red-700 focus-visible:border-red-600 focus-visible:ring-red-600/30 sm:w-auto"
            onClick={onConfirm}
            disabled={checking || deleting}
          >
            {deleting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            {isUnsafe(state) ? 'Deletar mesmo assim' : 'Remover do dispositivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
