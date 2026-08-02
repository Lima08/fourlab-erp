import type { Customer } from '@/shared/services/customerService'
import {
  formatCep,
  formatDocument,
  formatPhone,
} from '@/shared/utils/brazilianDocuments'

interface CustomerDetailSectionsProps {
  customer: Customer
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null

  return (
    <div>
      <dt className="text-industrial-500 text-xs font-semibold tracking-widest uppercase">
        {label}
      </dt>
      <dd className="text-industrial-900 mt-1 text-sm font-medium">{value}</dd>
    </div>
  )
}

function formatAddress(customer: Customer): string | null {
  const parts = [
    customer.street,
    customer.number,
    customer.complement,
    customer.neighborhood,
    customer.city,
    customer.state,
    customer.zipCode ? formatCep(customer.zipCode) : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : null
}

export function CustomerDetailSections({ customer }: CustomerDetailSectionsProps) {
  const title =
    customer.customerType === 'pj' && customer.tradeName ? customer.tradeName : customer.fullName
  const subtitle =
    customer.customerType === 'pj' && customer.tradeName ? customer.fullName : null

  return (
    <div className="space-y-6">
      <section className="border-industrial-200 space-y-3 rounded-xl border bg-white p-4">
        <div>
          <h1 className="text-industrial-900 text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="text-industrial-500 text-sm">{subtitle}</p>}
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailField
            label={customer.customerType === 'pj' ? 'CNPJ' : 'CPF'}
            value={
              customer.document
                ? formatDocument(customer.document, customer.customerType)
                : null
            }
          />
          <DetailField label="E-mail" value={customer.email} />
          <DetailField
            label="Telefone"
            value={customer.phone ? formatPhone(customer.phone) : null}
          />
          <DetailField label="Endereço" value={formatAddress(customer)} />
          <DetailField label="Instagram" value={customer.instagram} />
          <DetailField label="Facebook" value={customer.facebook} />
          <DetailField label="LinkedIn" value={customer.linkedin} />
          <DetailField label="Site" value={customer.website} />
          <DetailField label="Observações" value={customer.notes} />
        </dl>
      </section>
    </div>
  )
}
