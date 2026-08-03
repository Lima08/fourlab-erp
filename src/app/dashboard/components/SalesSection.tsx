import { formatCurrency } from '@/shared/utils/formatCurrency'
import type { MonthBucket } from '@/app/dashboard/utils/dashboardAggregates'
import { SalesEvolutionChart } from './SalesEvolutionChart'

interface SalesSectionProps {
  monthTotal: number
  evolution: MonthBucket[]
}

export function SalesSection({ monthTotal, evolution }: SalesSectionProps) {
  return (
    <section className="border-industrial-200 space-y-4 rounded-xl border bg-white p-4">
      <div>
        <h2 className="text-industrial-900 text-lg font-bold">Vendas</h2>
        <p className="text-industrial-500 text-sm">Aprovadas no mês e evolução (6 meses)</p>
      </div>

      <div>
        <p className="text-industrial-500 text-xs font-semibold tracking-wide uppercase">
          Total do mês
        </p>
        <p className="text-industrial-900 text-2xl font-extrabold tracking-tight">
          {formatCurrency(monthTotal)}
        </p>
        {monthTotal === 0 ? (
          <p className="text-industrial-500 mt-1 text-sm">Nenhuma venda aprovada neste mês.</p>
        ) : null}
      </div>

      <SalesEvolutionChart evolution={evolution} />
    </section>
  )
}
