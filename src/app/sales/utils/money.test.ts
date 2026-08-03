import { describe, expect, it } from 'vitest'
import { formatBrl, parseSearchAmount } from './money'

describe('parseSearchAmount', () => {
  it('retorna null para texto sem número', () => {
    expect(parseSearchAmount('João')).toBeNull()
  })

  it('parseia inteiro', () => {
    expect(parseSearchAmount('1500')).toBe(1500)
  })

  it('parseia decimal com ponto', () => {
    expect(parseSearchAmount('1500.50')).toBe(1500.5)
  })

  it('parseia decimal com vírgula', () => {
    expect(parseSearchAmount('1500,50')).toBe(1500.5)
  })

  it('ignora símbolo de moeda e espaços', () => {
    expect(parseSearchAmount('R$ 1.500,50')).toBe(1500.5)
  })
})

describe('formatBrl', () => {
  it('formata valor em BRL', () => {
    expect(formatBrl(1500.5)).toMatch(/1\.500,50/)
  })

  it('formata zero', () => {
    expect(formatBrl(0)).toMatch(/0,00/)
  })
})
