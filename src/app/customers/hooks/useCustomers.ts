import { useQuery } from '@tanstack/react-query'
import { PAGE_SIZE } from '@/app/customers/constants'
import { customerKeys } from '@/app/customers/hooks/customerKeys'
import {
  listCustomers,
  type CustomerStatusFilter,
} from '@/shared/services/customerService'

interface UseCustomersParams {
  page: number
  statusFilter: CustomerStatusFilter
  search: string
}

export function useCustomers({ page, statusFilter, search }: UseCustomersParams) {
  const params = {
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter,
    search,
  }

  const query = useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => listCustomers(params),
  })

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / PAGE_SIZE)) : 1

  return {
    customers: query.data?.rows ?? [],
    total: query.data?.total ?? 0,
    totalPages,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
