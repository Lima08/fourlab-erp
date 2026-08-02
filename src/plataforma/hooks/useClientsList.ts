import { useQuery } from '@tanstack/react-query'
import { fetchClientsList } from '@/shared/services/clientAdminService'

export function useClientsList(enabled = true) {
  return useQuery({
    queryKey: ['clients', 'list'],
    queryFn: fetchClientsList,
    enabled,
  })
}
