import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { BootSplash } from '@/shared/components/BootSplash'
import { useConnectivity } from '@/shared/hooks/useConnectivity'
import { usePendingInviteRedirect } from '@/shared/hooks/usePendingInviteRedirect'
import { useAuthStore } from '@/shared/stores/authStore'
import { preserveAuthRedirectSuffix } from '@/shared/navigation/getAuthHomePath'
import { refreshRemoteProjectMetadata } from '@/shared/services/sync/syncService'

export default function FieldGuard() {
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const { isOnline } = useConnectivity()
  const { shouldRedirectToActivateAccount, isChecking } = usePendingInviteRedirect()

  useEffect(() => {
    void refreshRemoteProjectMetadata()

    const handleOnline = () => void refreshRemoteProjectMetadata()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void refreshRemoteProjectMetadata()
      }
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  if (isInitializing || isChecking) return <BootSplash />

  if (shouldRedirectToActivateAccount) {
    return <Navigate to={`/ativar-conta${preserveAuthRedirectSuffix()}`} replace />
  }

  if (!user && isOnline) return <Navigate to="/login" replace />

  return <Outlet />
}
