import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import type { CustomerOrderSummary } from '@/shared/services/customerService'
import type { Database } from '@/shared/db/database.types'

interface CustomerOrdersSectionProps {
  orders: CustomerOrderSummary[]
  isLoading: boolean
}

const ORDER_STATUS_LABELS: Record<Database['public']['Enums']['order_status'], string> = {
  quote: 'Orçamento',
  approved: 'Aprovado',
  in_production: 'Em produção',
  completed: 'Concluído',
  delivered: 'Entregue',
  canceled: 'Cancelado',
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR')
}

export function CustomerOrdersSection({ orders, isLoading }: CustomerOrdersSectionProps) {
  return (
    <section className="border-industrial-200 space-y-4 rounded-xl border bg-white p-4">
      <div>
        <h2 className="text-industrial-900 text-lg font-bold">Pedidos</h2>
        <p className="text-industrial-500 text-sm">Histórico de compras (somente leitura)</p>
      </div>

      {isLoading ? (
        <p className="text-industrial-500 text-sm">Carregando pedidos…</p>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Icon name="shopping_bag" className="text-industrial-400 text-[28px]" />
          <p className="text-industrial-900 font-semibold">Nenhum pedido registrado</p>
          <p className="text-industrial-500 text-sm">
            Quando houver pedidos vinculados a este cliente, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <ul className="divide-industrial-200 divide-y">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-industrial-900 font-semibold">{formatDate(order.issueDate)}</p>
                <Badge variant="secondary">{ORDER_STATUS_LABELS[order.status]}</Badge>
              </div>
              <p className="text-industrial-900 text-base font-bold">
                {formatCurrency(order.totalAmount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
