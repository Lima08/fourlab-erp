import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { formatDocument } from '@/shared/utils/brazilianDocuments'
import type { Customer } from '@/shared/services/customerService'

interface CustomerListItemProps {
  customer: Customer
  onSelect: (id: string) => void
}

function displayName(customer: Customer): string {
  if (customer.customerType === 'pj' && customer.tradeName) {
    return customer.tradeName
  }
  return customer.fullName
}

function displaySubtitle(customer: Customer): string | null {
  if (customer.customerType === 'pj' && customer.tradeName) {
    return customer.fullName
  }
  if (customer.document) {
    return formatDocument(customer.document, customer.customerType)
  }
  return customer.email ?? customer.phone
}

export function CustomerListItem({ customer, onSelect }: CustomerListItemProps) {
  const subtitle = displaySubtitle(customer)

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(customer.id)}
        className="hover:bg-industrial-50 flex w-full items-start gap-3 p-4 text-left transition-colors"
      >
        <span className="bg-industrial-100 text-industrial-700 flex size-10 shrink-0 items-center justify-center rounded-full">
          <Icon
            name={customer.customerType === 'pj' ? 'business' : 'person'}
            className="text-[20px]"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-industrial-900 truncate text-base font-bold">
              {displayName(customer)}
            </span>
            {!customer.isActive && (
              <Badge variant="secondary" className="uppercase">
                Inativo
              </Badge>
            )}
          </span>
          {subtitle && (
            <span className="text-industrial-500 mt-0.5 block truncate text-sm">{subtitle}</span>
          )}
        </span>
        <Icon name="chevron_right" className="text-industrial-400 mt-2 shrink-0 text-[20px]" />
      </button>
    </li>
  )
}
