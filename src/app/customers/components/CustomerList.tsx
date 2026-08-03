import type { Customer } from '@/shared/services/customerService'
import { CustomerListItem } from '@/app/customers/components/CustomerListItem'

interface CustomerListProps {
  customers: Customer[]
  onSelect: (id: string) => void
}

export function CustomerList({ customers, onSelect }: CustomerListProps) {
  return (
    <ul className="divide-industrial-200 divide-y rounded-xl border border-industrial-200 bg-white">
      {customers.map((customer) => (
        <CustomerListItem key={customer.id} customer={customer} onSelect={onSelect} />
      ))}
    </ul>
  )
}
