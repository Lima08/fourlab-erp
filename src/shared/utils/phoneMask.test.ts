import { describe, it, expect } from 'vitest'
import { formatPhoneInput, isValidBrPhone, stripPhone } from './phoneMask'

describe('stripPhone', () => {
  it('remove caracteres não numéricos', () => {
    expect(stripPhone('(11) 98765-4321')).toBe('11987654321')
    expect(stripPhone('abc')).toBe('')
  })
})

describe('formatPhoneInput', () => {
  it('formata parcialmente com DDD', () => {
    expect(formatPhoneInput('11')).toBe('(11')
    expect(formatPhoneInput('119')).toBe('(11) 9')
  })

  it('formata telefone fixo com 10 dígitos', () => {
    expect(formatPhoneInput('1134567890')).toBe('(11) 3456-7890')
  })

  it('formata celular com 11 dígitos', () => {
    expect(formatPhoneInput('11987654321')).toBe('(11) 98765-4321')
  })

  it('limita a 11 dígitos', () => {
    expect(formatPhoneInput('11987654321999')).toBe('(11) 98765-4321')
  })
})

describe('isValidBrPhone', () => {
  it('aceita fixo com 10 dígitos', () => {
    expect(isValidBrPhone('(11) 3456-7890')).toBe(true)
  })

  it('aceita celular com 11 dígitos', () => {
    expect(isValidBrPhone('(11) 98765-4321')).toBe(true)
  })

  it('rejeita menos de 10 dígitos', () => {
    expect(isValidBrPhone('(11) 3456')).toBe(false)
  })

  it('rejeita mais de 11 dígitos', () => {
    expect(isValidBrPhone('119876543219')).toBe(false)
  })
})
