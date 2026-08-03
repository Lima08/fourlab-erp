import { useQuery } from '@tanstack/react-query'
import { dashboardKeys } from '@/app/dashboard/hooks/dashboardKeys'
import { fetchDashboardSnapshot } from '@/shared/services/dashboardService'

const DASHBOARD_STALE_MS = 45_000

export function useDashboard() {
  const query = useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => fetchDashboardSnapshot(),
    staleTime: DASHBOARD_STALE_MS,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}
