import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CustomerForm } from '@/app/customers/components/CustomerForm'
import { useCustomer } from '@/app/customers/hooks/useCustomer'
import { useCustomerMutations } from '@/app/customers/hooks/useCustomerMutations'
import type { CustomerFormValues } from '@/app/customers/schemas/customerFormSchema'
import { CustomerError } from '@/shared/services/customerService'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'

export default function CustomerEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { customer, isLoading, isNotFound } = useCustomer(id)
  const { updateCustomer } = useCustomerMutations()

  async function handleSubmit(values: CustomerFormValues) {
    if (!id) return

    try {
      await updateCustomer.mutateAsync({ id, input: values })
      toast.success('Cliente atualizado com sucesso')
      navigate(`/clientes/${id}`)
    } catch (error) {
      if (error instanceof CustomerError && error.code === 'DOCUMENT_CONFLICT') {
        toast.error('Já existe cliente com este documento')
        return
      }
      toast.error('Não foi possível salvar as alterações. Tente novamente.')
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

  return (
    <div className="space-y-6">
      <Link
        to={`/clientes/${customer.id}`}
        className="text-industrial-500 hover:text-industrial-900 inline-flex items-center gap-1 text-sm font-semibold"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Voltar
      </Link>
      <div>
        <h1 className="text-industrial-900 text-2xl font-extrabold tracking-tight">Editar cliente</h1>
        <p className="text-industrial-500 text-sm">{customer.fullName}</p>
      </div>
      <CustomerForm
        mode="edit"
        defaultValues={{
          customerType: customer.customerType,
          fullName: customer.fullName,
          tradeName: customer.tradeName ?? undefined,
          document: customer.document ?? undefined,
          email: customer.email ?? undefined,
          phone: customer.phone ?? undefined,
          zipCode: customer.zipCode ?? undefined,
          street: customer.street ?? undefined,
          number: customer.number ?? undefined,
          complement: customer.complement ?? undefined,
          neighborhood: customer.neighborhood ?? undefined,
          city: customer.city ?? undefined,
          state: customer.state ?? undefined,
          instagram: customer.instagram ?? undefined,
          facebook: customer.facebook ?? undefined,
          linkedin: customer.linkedin ?? undefined,
          website: customer.website ?? undefined,
          notes: customer.notes ?? undefined,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateCustomer.isPending}
      />
    </div>
  )
}
