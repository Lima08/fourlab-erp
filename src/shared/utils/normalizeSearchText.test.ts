import { describe, it, expect } from 'vitest'
import { matchesSearchText, normalizeSearchText } from './normalizeSearchText'

describe('normalizeSearchText', () => {
  it('remove acentos e normaliza case', () => {
    expect(normalizeSearchText('Condomínio Águas')).toBe('condominio aguas')
  })
})

describe('matchesSearchText', () => {
  it('encontra texto ignorando acentos e maiúsculas', () => {
    expect(matchesSearchText('Condomínio Residencial', 'condominio')).toBe(true)
    expect(matchesSearchText('Condomínio Residencial', 'RESIDENCIAL')).toBe(true)
    expect(matchesSearchText('Condomínio Residencial', 'agua')).toBe(false)
  })

  it('retorna true quando busca está vazia', () => {
    expect(matchesSearchText('Qualquer Nome', '   ')).toBe(true)
  })
})
