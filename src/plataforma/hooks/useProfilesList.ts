import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchProfileList, type ProfileListParams } from '@/shared/services/profileAdminService'

export function useProfilesList(params: ProfileListParams, enabled = true) {
  const { filter, search, page, pageSize } = params

  return useQuery({
    queryKey: ['profiles', 'list', filter, search, page, pageSize],
    queryFn: () => fetchProfileList(params),
    enabled,
    placeholderData: keepPreviousData,
  })
}
