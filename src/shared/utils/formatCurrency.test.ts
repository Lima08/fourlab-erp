import { describe, expect, it } from 'vitest'
import { formatCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('formata valor em BRL no locale pt-BR', () => {
    expect(formatCurrency(1500.5)).toBe('R$\u00a01.500,50')
  })

  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00')
  })

  it('formata valores negativos', () => {
    expect(formatCurrency(-10)).toBe('-R$\u00a010,00')
  })
})
