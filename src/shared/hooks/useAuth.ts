import { useEffect } from 'react'
import { supabase } from '@/shared/db/supabase'
import { useAuthStore } from '@/shared/stores/authStore'

export function useAuth() {
  const { user, sessionExpired, isInitializing, setUser, setSessionExpired, setInitializing } =
    useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setInitializing(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'TOKEN_REFRESHED') setSessionExpired(false)
      if ((event as string) === 'TOKEN_REFRESH_FAILED') setSessionExpired(true)
      if (event === 'SIGNED_OUT') setSessionExpired(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSessionExpired, setInitializing])

  return { user, sessionExpired, isInitializing }
}
