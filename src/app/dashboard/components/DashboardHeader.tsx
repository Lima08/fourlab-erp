import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

interface DashboardHeaderProps {
  monthLabel: string
  onRefresh: () => void
  isRefreshing: boolean
}

export function DashboardHeader({ monthLabel, onRefresh, isRefreshing }: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-industrial-900 text-2xl font-extrabold tracking-tight">Início</h1>
        <p className="text-industrial-500 text-sm capitalize">{monthLabel}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="touch"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Atualizar dashboard"
      >
        <Icon name="refresh" className={isRefreshing ? 'animate-spin' : undefined} />
        Atualizar
      </Button>
    </div>
  )
}
