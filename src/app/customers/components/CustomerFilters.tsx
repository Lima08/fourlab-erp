import { FilterPill } from '@/components/ui/filter-pill'
import {
  CUSTOMER_STATUS_FILTERS,
  type CustomerStatusFilterId,
} from '@/app/customers/constants'

interface CustomerFiltersProps {
  activeFilter: CustomerStatusFilterId
  counts: Record<CustomerStatusFilterId, number>
  onFilterChange: (filter: CustomerStatusFilterId) => void
}

export function CustomerFilters({
  activeFilter,
  counts,
  onFilterChange,
}: CustomerFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {CUSTOMER_STATUS_FILTERS.map((filter) => (
        <FilterPill
          key={filter.id}
          id={filter.id}
          label={filter.label}
          icon={filter.icon}
          count={counts[filter.id]}
          active={activeFilter === filter.id}
          onClick={onFilterChange}
        />
      ))}
    </div>
  )
}
