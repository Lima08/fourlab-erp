import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

interface Props {
  isOffline?: boolean
  onOpenModal: () => void
}
export function DashboardPageHeader({ isOffline = false, onOpenModal }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-industrial-950 text-3xl font-extrabold tracking-tight md:text-4xl">
          Dashboard
        </h1>
        <p className="text-industrial-600 mt-1 text-sm">
          Visão geral da carteira · Toque em um card para abrir os projetos já filtrados.
        </p>
      </div>
      <Button
        type="button"
        onClick={onOpenModal}
        disabled={isOffline}
        className="bg-industrial-950 hover:bg-industrial-800 h-11 shrink-0 gap-2 rounded-lg px-5 text-sm font-semibold text-white"
      >
        <Icon name="add" className="text-[18px]" />
        Novo projeto
      </Button>
    </div>
  )
}
