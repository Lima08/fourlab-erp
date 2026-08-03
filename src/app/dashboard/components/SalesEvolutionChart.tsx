import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthBucket } from '@/app/dashboard/utils/dashboardAggregates'
import { formatCurrency } from '@/shared/utils/formatCurrency'

interface SalesEvolutionChartProps {
  evolution: MonthBucket[]
}

export function SalesEvolutionChart({ evolution }: SalesEvolutionChartProps) {
  return (
    <div className="h-48 w-full" data-testid="sales-evolution-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={evolution} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) =>
              new Intl.NumberFormat('pt-BR', {
                notation: 'compact',
                compactDisplay: 'short',
              }).format(v)
            }
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value ?? 0))}
            contentStyle={{
              borderRadius: 8,
              borderColor: '#e2e8f0',
              fontSize: 12,
            }}
          />
          <Bar dataKey="total" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
