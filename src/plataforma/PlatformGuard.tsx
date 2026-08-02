import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentProfile } from '@/shared/hooks/useCurrentProfile'
import { usePendingInviteRedirect } from '@/shared/hooks/usePendingInviteRedirect'
import { preserveAuthRedirectSuffix } from '@/shared/navigation/getAuthHomePath'
import { useAuthStore } from '@/shared/stores/authStore'

export default function PlatformGuard() {
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const { isAdmin, isLoading } = useCurrentProfile()
  const { shouldRedirectToActivateAccount, isChecking: isCheckingInvite } =
    usePendingInviteRedirect()

  if (isInitializing || (user && isLoading) || isCheckingInvite) return null

  if (shouldRedirectToActivateAccount) {
    return <Navigate to={`/ativar-conta${preserveAuthRedirectSuffix()}`} replace />
  }

  if (!user) return <Navigate to="/login" replace />

  if (!isAdmin) return <Navigate to="/campo" replace />

  return <Outlet />
}
