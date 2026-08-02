import { Navigate, Outlet } from 'react-router-dom'
import { BootSplash } from '@/shared/components/BootSplash'
import { usePendingInviteRedirect } from '@/shared/hooks/usePendingInviteRedirect'
import { useAuthStore } from '@/shared/stores/authStore'
import { preserveAuthRedirectSuffix } from '@/shared/navigation/getAuthHomePath'
import { supabase } from '@/shared/db/supabase'
import { queryClient } from '@/shared/providers/queryClient'
import { useEffect } from 'react'

export default function AppGuard() {
  const user = useAuthStore((s) => s.user)
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const { shouldRedirectToActivateAccount, isDeactivated, isChecking } =
    usePendingInviteRedirect()

  useEffect(() => {
    if (!isDeactivated) return
    void (async () => {
      await supabase.auth.signOut()
      useAuthStore.getState().setUser(null)
      queryClient.removeQueries({ queryKey: ['profile'] })
    })()
  }, [isDeactivated])

  if (isInitializing || isChecking) return <BootSplash />

  if (shouldRedirectToActivateAccount) {
    return <Navigate to={`/ativar-conta${preserveAuthRedirectSuffix()}`} replace />
  }

  if (isDeactivated) {
    return <Navigate to="/login" replace />
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
