import { useCurrentProfile } from '@/shared/hooks/useCurrentProfile'
import { useConnectivity } from '@/shared/hooks/useConnectivity'
import { useAuthStore } from '@/shared/stores/authStore'

export function usePendingInviteRedirect() {
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const { profile, isPendingInvite, isLoading, isError } = useCurrentProfile()
  const { isOnline } = useConnectivity()

  const isChecking = isInitializing || (!!user && isLoading)
  const profileUnresolvedOnline = isOnline && !isLoading && (profile === null || isError)
  const shouldRedirectToActivateAccount =
    !!user && !isChecking && (isPendingInvite || profileUnresolvedOnline)

  return { shouldRedirectToActivateAccount, isChecking }
}
