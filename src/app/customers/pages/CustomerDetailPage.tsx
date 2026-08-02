import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { CustomerDetailSections } from '@/app/customers/components/CustomerDetailSections'
import { CustomerOrdersSection } from '@/app/customers/components/CustomerOrdersSection'
import { CustomerStatusActions } from '@/app/customers/components/CustomerStatusActions'
import { useCustomer } from '@/app/customers/hooks/useCustomer'
import { useCustomerOrders } from '@/app/customers/hooks/useCustomerOrders'
import { useCustomerMutations } from '@/app/customers/hooks/useCustomerMutations'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { customer, isLoading, isNotFound } = useCustomer(id)
  const { orders, isLoading: isOrdersLoading } = useCustomerOrders(id)
  const { setCustomerActive } = useCustomerMutations()

  async function handleStatusChange() {
    if (!customer) return

    try {
      await setCustomerActive.mutateAsync({
        id: customer.id,
        isActive: !customer.isActive,
      })
      toast.success(customer.isActive ? 'Cliente inativado' : 'Cliente reativado')
    } catch {
      toast.error('Não foi possível alterar o status do cliente.')
    }
  }

  if (isLoading) {
    return <p className="text-industrial-500 text-sm">Carregando cliente…</p>
  }

  if (isNotFound || !customer) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-industrial-900 text-lg font-bold">Cliente não encontrado</p>
        <Button render={<Link to="/clientes" />}>Voltar para clientes</Button>
      </div>
    )
  }

  const displayName =
    customer.customerType === 'pj' && customer.tradeName
      ? customer.tradeName
      : customer.fullName

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/clientes"
          className="text-industrial-500 hover:text-industrial-900 inline-flex items-center gap-1 text-sm font-semibold"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Clientes
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={customer.isActive ? 'default' : 'secondary'}>
            {customer.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
          <Button render={<Link to={`/clientes/${customer.id}/editar`} />} variant="outline">
            Editar
          </Button>
        </div>
      </div>

      <CustomerDetailSections customer={customer} />

      <CustomerOrdersSection orders={orders} isLoading={isOrdersLoading} />

      <CustomerStatusActions
        customerName={displayName}
        isActive={customer.isActive}
        isPending={setCustomerActive.isPending}
        onConfirm={handleStatusChange}
      />
    </div>
  )
}
