import { describe, it, expect } from 'vitest'
import {
  formatCep,
  formatCnpj,
  formatCpf,
  formatDocument,
  formatPhone,
  isValidCnpj,
  isValidCpf,
  stripDigits,
} from './brazilianDocuments'

describe('stripDigits', () => {
  it('remove caracteres não numéricos', () => {
    expect(stripDigits('529.982.247-25')).toBe('52998224725')
  })
})

describe('isValidCpf', () => {
  it('aceita CPF válido conhecido', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('52998224725')).toBe(true)
  })

  it('rejeita CPF com dígitos verificadores inválidos', () => {
    expect(isValidCpf('529.982.247-24')).toBe(false)
  })

  it('rejeita sequência de dígitos repetidos', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false)
    expect(isValidCpf('00000000000')).toBe(false)
  })

  it('rejeita CPF com tamanho incorreto', () => {
    expect(isValidCpf('123456789')).toBe(false)
  })
})

describe('isValidCnpj', () => {
  it('aceita CNPJ válido conhecido', () => {
    expect(isValidCnpj('11.444.777/0001-61')).toBe(true)
    expect(isValidCnpj('11444777000161')).toBe(true)
  })

  it('rejeita CNPJ com dígitos verificadores inválidos', () => {
    expect(isValidCnpj('11.444.777/0001-60')).toBe(false)
  })

  it('rejeita sequência de dígitos repetidos', () => {
    expect(isValidCnpj('11.111.111/1111-11')).toBe(false)
  })

  it('rejeita CNPJ com tamanho incorreto', () => {
    expect(isValidCnpj('1234567890123')).toBe(false)
  })
})

describe('formatadores', () => {
  it('formata CPF parcialmente', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
  })

  it('formata CNPJ parcialmente', () => {
    expect(formatCnpj('11444777000161')).toBe('11.444.777/0001-61')
  })

  it('formata documento conforme tipo', () => {
    expect(formatDocument('52998224725', 'pf')).toBe('529.982.247-25')
    expect(formatDocument('11444777000161', 'pj')).toBe('11.444.777/0001-61')
  })

  it('formata telefone celular e fixo', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    expect(formatPhone('1132654321')).toBe('(11) 3265-4321')
  })

  it('formata CEP', () => {
    expect(formatCep('01310100')).toBe('01310-100')
  })
})
