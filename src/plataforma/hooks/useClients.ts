import { useQuery } from '@tanstack/react-query'
import { fetchClients } from '@/shared/services/clientService'

export function useClients() {
  return useQuery({
    queryKey: ['clients', 'list'],
    queryFn: fetchClients,
  })
}
