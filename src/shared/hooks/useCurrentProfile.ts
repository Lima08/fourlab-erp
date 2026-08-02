import { useQuery } from '@tanstack/react-query'
import { fetchOwnProfile } from '@/shared/services/profileService'
import { useAuthStore } from '@/shared/stores/authStore'

export function useCurrentProfile() {
  const user = useAuthStore((s) => s.user)

  const query = useQuery({
    queryKey: ['profile', 'current', user?.id],
    queryFn: fetchOwnProfile,
    enabled: !!user,
  })

  return {
    profile: query.data ?? null,
    isAdmin: query.data?.role === 'admin',
    isSuspended: query.data?.status === 'suspenso',
    isPendingInvite: query.data?.status === 'convite_pendente',
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
