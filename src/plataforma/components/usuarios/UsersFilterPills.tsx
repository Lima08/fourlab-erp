import { FilterPill } from '@/components/ui/filter-pill'
import { FILTER_PILLS } from '@/plataforma/constants/userLabels'
import type { ProfileCounts, ProfileFilter } from '@/shared/services/profileAdminService'

interface Props {
  activeFilter: ProfileFilter
  counts: ProfileCounts | null | undefined
  isOffline?: boolean
  onFilterChange: (filter: ProfileFilter) => void
}

export function UsersFilterPills({
  activeFilter,
  counts,
  isOffline = false,
  onFilterChange,
}: Props) {
  return (
    <div
      className="-mx-1 flex flex-wrap items-center gap-2 px-1 pb-1"
      role="group"
      aria-label="Filtrar usuários"
    >
      {FILTER_PILLS.map((pill) => (
        <FilterPill
          key={pill.id}
          id={pill.id}
          label={pill.label}
          icon={pill.icon}
          count={isOffline ? 0 : (counts?.[pill.countKey] ?? 0)}
          active={activeFilter === pill.id}
          onClick={onFilterChange}
        />
      ))}
    </div>
  )
}
