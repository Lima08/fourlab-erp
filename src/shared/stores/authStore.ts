import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  sessionExpired: boolean
  isInitializing: boolean
  setUser: (user: User | null) => void
  setSessionExpired: (v: boolean) => void
  setInitializing: (v: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionExpired: false,
  isInitializing: true,
  setUser: (user) => set({ user }),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),
  setInitializing: (isInitializing) => set({ isInitializing }),
}))
