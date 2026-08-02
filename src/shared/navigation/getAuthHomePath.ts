import type { ProfileRole } from '@/shared/types/profile'
import { isUserManagementEnabled } from '../config/features'

export function getAuthHomePath(role: ProfileRole): '/plataforma' | '/campo' {
  if (!isUserManagementEnabled()) return '/campo'
  return role === 'admin' ? '/plataforma' : '/campo'
}

export const INVITE_ACCOUNT_PATH = '/ativar-conta' as const
export const PASSWORD_RECOVERY_PATH = '/reset-senha' as const

export function getInviteRedirectTo(origin = window.location.origin): string {
  return `${origin}${INVITE_ACCOUNT_PATH}`
}

export function getPasswordRecoveryRedirectTo(origin = window.location.origin): string {
  return `${origin}${PASSWORD_RECOVERY_PATH}`
}

/** Preserva query PKCE (`code=`) e hash (`access_token`) em redirects internos. */
export function preserveAuthRedirectSuffix(
  search = window.location.search,
  hash = window.location.hash
): string {
  return `${search}${hash}`
}
