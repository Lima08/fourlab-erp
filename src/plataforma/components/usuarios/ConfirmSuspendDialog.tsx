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

export function ConfirmSuspendDialog({
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
          <DialogTitle>Suspender acesso</DialogTitle>
          <DialogDescription>
            Suspender o acesso de {name}? O usuário não conseguirá fazer login até ser reativado.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Suspender
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
