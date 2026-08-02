import { useQuery } from '@tanstack/react-query'
import { fetchProfileCounts } from '@/shared/services/profileAdminService'

export function useProfileCounts(enabled = true) {
  return useQuery({
    queryKey: ['profiles', 'counts'],
    queryFn: fetchProfileCounts,
    enabled,
  })
}
