import { Navigate } from 'react-router-dom'
import { useCurrentProfile } from '@/shared/hooks/useCurrentProfile'
import { useAuthStore } from '@/shared/stores/authStore'
import {
  getAuthHomePath,
  INVITE_ACCOUNT_PATH,
  preserveAuthRedirectSuffix,
} from '@/shared/navigation/getAuthHomePath'

export default function RootRedirect() {
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const { profile, isPendingInvite, isLoading } = useCurrentProfile()
  const authSuffix = preserveAuthRedirectSuffix()

  if (isInitializing || (user && isLoading)) return null

  if (user && isPendingInvite) {
    return <Navigate to={`${INVITE_ACCOUNT_PATH}${authSuffix}`} replace />
  }

  if (user && profile) {
    return <Navigate to={`${getAuthHomePath(profile.role)}${authSuffix}`} replace />
  }

  return <Navigate to={`/campo${authSuffix}`} replace />
}
