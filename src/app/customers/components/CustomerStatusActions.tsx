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

interface CustomerStatusActionsProps {
  customerName: string
  isActive: boolean
  isPending?: boolean
  onConfirm: () => Promise<void>
}

export function CustomerStatusActions({
  customerName,
  isActive,
  isPending = false,
  onConfirm,
}: CustomerStatusActionsProps) {
  const [open, setOpen] = useState(false)

  async function handleConfirm() {
    await onConfirm()
    setOpen(false)
  }

  return (
    <>
      <Button
        type="button"
        variant={isActive ? 'destructive' : 'secondary'}
        size="touch"
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        {isActive ? 'Inativar cliente' : 'Reativar cliente'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isActive ? 'Inativar cliente' : 'Reativar cliente'}
            </DialogTitle>
            <DialogDescription>
              {isActive
                ? `${customerName} deixará de aparecer na listagem de ativos, mas o histórico será mantido.`
                : `${customerName} voltará a aparecer na listagem de clientes ativos.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={isPending}>
              {isPending ? 'Salvando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
