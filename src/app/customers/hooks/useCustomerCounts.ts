import { useQuery } from '@tanstack/react-query'
import { customerKeys } from '@/app/customers/hooks/customerKeys'
import { getCustomerStatusCounts } from '@/shared/services/customerService'

export function useCustomerCounts(search: string) {
  const query = useQuery({
    queryKey: customerKeys.counts(search),
    queryFn: () => getCustomerStatusCounts(search),
  })

  return {
    counts: query.data ?? { active: 0, inactive: 0, all: 0 },
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
