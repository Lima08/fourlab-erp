import { describe, expect, it } from 'vitest'
import {
  getBrazilMonthBounds,
  getBrazilTodayIso,
  listBrazilMonths,
} from './brazilCalendarMonth'

describe('brazilCalendarMonth', () => {
  it('resolve a data civil em America/Sao_Paulo a partir de um instante UTC', () => {
    // 2026-08-01 02:00 UTC = ainda 31/07 à noite em SP (UTC-3)
    const instant = new Date('2026-08-01T02:00:00.000Z')
    expect(getBrazilTodayIso(instant)).toBe('2026-07-31')
  })

  it('retorna bounds do mês civil atual em SP', () => {
    const instant = new Date('2026-08-15T15:00:00.000Z')
    expect(getBrazilMonthBounds(instant)).toEqual({
      start: '2026-08-01',
      end: '2026-08-31',
      monthKey: '2026-08',
    })
  })

  it('trata fevereiro em ano não-bissexto', () => {
    const instant = new Date('2026-02-10T15:00:00.000Z')
    expect(getBrazilMonthBounds(instant)).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
      monthKey: '2026-02',
    })
  })

  it('lista os últimos 6 meses incluindo o atual (do mais antigo ao atual)', () => {
    const instant = new Date('2026-08-15T15:00:00.000Z')
    const months = listBrazilMonths(6, instant)

    expect(months).toHaveLength(6)
    expect(months.map((m) => m.monthKey)).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
    ])
    expect(months.at(-1)?.label).toBe('ago/2026')
  })
})
