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

  const profile = query.data ?? null
  const isPendingInvite = profile !== null && profile.activatedAt === null
  const isDeactivated =
    profile !== null && profile.activatedAt !== null && !profile.isActive

  return {
    profile,
    isPendingInvite,
    isDeactivated,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
