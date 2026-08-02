import type { ReactNode } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'

export default function AuthProvider({ children }: { children: ReactNode }) {
  useAuth()
  return <>{children}</>
}
