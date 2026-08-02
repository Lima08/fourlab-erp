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
import type { Profile } from '@/shared/types/profile'

interface Props {
  open: boolean
  profile: Profile | null
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
}

export function ConfirmRemoveDialog({
  open,
  profile,
  onConfirm,
  onCancel,
  isPending = false,
}: Props) {
  const name = profile?.fullName ?? 'este usuário'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isPending && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Remover usuário</DialogTitle>
          <DialogDescription>
            Remover {name} da equipe? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Remover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
