import { useQuery } from '@tanstack/react-query'
import { customerKeys } from '@/app/customers/hooks/customerKeys'
import { getCustomer } from '@/shared/services/customerService'

export function useCustomer(id: string | undefined) {
  const query = useQuery({
    queryKey: customerKeys.detail(id ?? ''),
    queryFn: () => getCustomer(id!),
    enabled: !!id,
  })

  return {
    customer: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isNotFound: !query.isLoading && !!id && query.data === null,
  }
}
