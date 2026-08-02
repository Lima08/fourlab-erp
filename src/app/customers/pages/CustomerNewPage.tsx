import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CustomerForm } from '@/app/customers/components/CustomerForm'
import { useCustomerMutations } from '@/app/customers/hooks/useCustomerMutations'
import type { CustomerFormValues } from '@/app/customers/schemas/customerFormSchema'
import { CustomerError } from '@/shared/services/customerService'
import { Icon } from '@/components/ui/icon'

export default function CustomerNewPage() {
  const navigate = useNavigate()
  const { createCustomer } = useCustomerMutations()

  async function handleSubmit(values: CustomerFormValues) {
    try {
      const customer = await createCustomer.mutateAsync(values)
      toast.success('Cliente cadastrado com sucesso')
      navigate(`/clientes/${customer.id}`)
    } catch (error) {
      if (error instanceof CustomerError && error.code === 'DOCUMENT_CONFLICT') {
        toast.error('Já existe cliente com este documento')
        return
      }
      toast.error('Não foi possível cadastrar o cliente. Tente novamente.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/clientes"
          className="text-industrial-500 hover:text-industrial-900 inline-flex items-center gap-1 text-sm font-semibold"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Voltar
        </Link>
      </div>
      <div>
        <h1 className="text-industrial-900 text-2xl font-extrabold tracking-tight">Novo cliente</h1>
        <p className="text-industrial-500 text-sm">Cadastre PF ou PJ com os dados disponíveis</p>
      </div>
      <CustomerForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createCustomer.isPending}
      />
    </div>
  )
}
