import { useCurrentProfile } from '@/shared/hooks/useCurrentProfile'
import { useConnectivity } from '@/shared/hooks/useConnectivity'
import { useAuthStore } from '@/shared/stores/authStore'

export function usePendingInviteRedirect() {
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const { profile, isPendingInvite, isDeactivated, isLoading, isError } = useCurrentProfile()
  const { isOnline } = useConnectivity()

  const isChecking = isInitializing || (!!user && isLoading)
  // Missing profile online may still be an invite race; do not treat query errors as invites.
  const missingProfileOnline = isOnline && !isLoading && !isError && profile === null
  const shouldRedirectToActivateAccount =
    !!user && !isChecking && (isPendingInvite || missingProfileOnline)

  return { shouldRedirectToActivateAccount, isDeactivated, isChecking }
}
