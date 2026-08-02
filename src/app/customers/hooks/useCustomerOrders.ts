import { useQuery } from '@tanstack/react-query'
import { customerKeys } from '@/app/customers/hooks/customerKeys'
import { listCustomerOrders } from '@/shared/services/customerService'

export function useCustomerOrders(customerId: string | undefined) {
  const query = useQuery({
    queryKey: customerKeys.orders(customerId ?? ''),
    queryFn: () => listCustomerOrders(customerId!),
    enabled: !!customerId,
  })

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
