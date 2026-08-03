import { Button } from '@/components/ui/button'

interface DashboardErrorStateProps {
  onRetry: () => void
}

export function DashboardErrorState({ onRetry }: DashboardErrorStateProps) {
  return (
    <div className="border-industrial-200 space-y-3 rounded-xl border bg-white p-6 text-center">
      <p className="text-industrial-900 font-semibold">Não foi possível carregar o dashboard.</p>
      <p className="text-industrial-500 text-sm">Verifique a conexão e tente novamente.</p>
      <Button type="button" size="touch" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  )
}
