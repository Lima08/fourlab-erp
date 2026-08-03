import { describe, expect, it } from 'vitest'
import { getPeriodRange } from './periodRange'

describe('getPeriodRange', () => {
  it('retorna o mês corrente por padrão', () => {
    const range = getPeriodRange({ today: '2026-08-15' })

    expect(range).toEqual({ from: '2026-08-01', to: '2026-08-31' })
  })

  it('retorna o mês do preset month', () => {
    const range = getPeriodRange({ preset: 'month', today: '2026-02-10' })

    expect(range).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })

  it('retorna o trimestre corrente', () => {
    const range = getPeriodRange({ preset: 'quarter', today: '2026-08-15' })

    expect(range).toEqual({ from: '2026-07-01', to: '2026-09-30' })
  })

  it('retorna o ano corrente', () => {
    const range = getPeriodRange({ preset: 'year', today: '2026-08-15' })

    expect(range).toEqual({ from: '2026-01-01', to: '2026-12-31' })
  })

  it('retorna o intervalo custom informado', () => {
    const range = getPeriodRange({
      preset: 'custom',
      from: '2026-03-01',
      to: '2026-03-20',
      today: '2026-08-15',
    })

    expect(range).toEqual({ from: '2026-03-01', to: '2026-03-20' })
  })
})
