import { describe, it, expect } from 'vitest'
import {
  getAuthHomePath,
  getInviteRedirectTo,
  getPasswordRecoveryRedirectTo,
  preserveAuthRedirectSuffix,
} from './getAuthHomePath'

describe('getAuthHomePath', () => {
  it('sempre envia para /inicio', () => {
    expect(getAuthHomePath()).toBe('/inicio')
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
