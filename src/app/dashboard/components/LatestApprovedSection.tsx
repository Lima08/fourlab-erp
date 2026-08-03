import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/shared/utils/formatCurrency'
import type { LatestApprovedItem } from '@/app/dashboard/utils/dashboardAggregates'

const STATUS_LABELS: Record<LatestApprovedItem['status'], string> = {
  approved: 'Aprovado',
  in_production: 'Em produção',
  completed: 'Concluído',
  delivered: 'Entregue',
}

interface LatestApprovedSectionProps {
  items: LatestApprovedItem[]
}

function formatApprovalDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR')
}

export function LatestApprovedSection({ items }: LatestApprovedSectionProps) {
  return (
    <section className="border-industrial-200 space-y-4 rounded-xl border bg-white p-4">
      <div>
        <h2 className="text-industrial-900 text-lg font-bold">Últimos orçamentos aprovados</h2>
        <p className="text-industrial-500 text-sm">Compromissos comerciais recentes</p>
      </div>

      {items.length === 0 ? (
        <p className="text-industrial-500 text-sm">Nenhum orçamento aprovado ainda.</p>
      ) : (
        <ul className="divide-industrial-200 divide-y">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-industrial-900 truncate font-semibold">{item.customerName}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{STATUS_LABELS[item.status]}</Badge>
                  <span className="text-industrial-500 text-xs">
                    {formatApprovalDate(item.approvalDate)}
                  </span>
                </div>
              </div>
              <p className="text-industrial-900 text-base font-bold">
                {formatCurrency(item.totalAmount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
