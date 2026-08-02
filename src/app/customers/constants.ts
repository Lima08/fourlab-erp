export const PAGE_SIZE = 20

export const CUSTOMER_STATUS_FILTERS = [
  { id: 'active' as const, label: 'Ativos', icon: 'check_circle' },
  { id: 'inactive' as const, label: 'Inativos', icon: 'pause_circle' },
  { id: 'all' as const, label: 'Todos', icon: 'groups' },
]

export type CustomerStatusFilterId = (typeof CUSTOMER_STATUS_FILTERS)[number]['id']
