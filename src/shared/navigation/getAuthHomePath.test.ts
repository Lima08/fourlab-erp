import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isUserManagementEnabled } from '@/shared/config/features'
import {
  getAuthHomePath,
  getInviteRedirectTo,
  getPasswordRecoveryRedirectTo,
  preserveAuthRedirectSuffix,
} from './getAuthHomePath'

vi.mock('@/shared/config/features', () => ({
  isUserManagementEnabled: vi.fn(() => true),
}))

describe('getAuthHomePath', () => {
  beforeEach(() => {
    vi.mocked(isUserManagementEnabled).mockReturnValue(true)
  })

  it('envia admin para /plataforma', () => {
    expect(getAuthHomePath('admin')).toBe('/plataforma')
  })

  it('envia admin para /campo quando gestão de usuários está desativada', () => {
    vi.mocked(isUserManagementEnabled).mockReturnValue(false)
    expect(getAuthHomePath('admin')).toBe('/campo')
  })

  it('envia cliente para /campo', () => {
    expect(getAuthHomePath('cliente')).toBe('/campo')
  })
})

describe('redirect URLs', () => {
  it('monta URL de convite com /ativar-conta', () => {
    expect(getInviteRedirectTo('https://app.exemplo.com')).toBe(
      'https://app.exemplo.com/ativar-conta'
    )
  })

  it('monta URL de recuperação com /reset-senha', () => {
    expect(getPasswordRecoveryRedirectTo('https://app.exemplo.com')).toBe(
      'https://app.exemplo.com/reset-senha'
    )
  })
})

describe('preserveAuthRedirectSuffix', () => {
  it('preserva query PKCE e hash de tokens', () => {
    expect(preserveAuthRedirectSuffix('?code=abc', '#access_token=xyz')).toBe(
      '?code=abc#access_token=xyz'
    )
  })

  it('retorna string vazia sem query nem hash', () => {
    expect(preserveAuthRedirectSuffix('', '')).toBe('')
  })
})
