import { describe, expect, it } from 'vitest'
import { getEffectiveInstallmentStatus } from './installmentStatus'

describe('getEffectiveInstallmentStatus', () => {
  it('mantém paid', () => {
    expect(getEffectiveInstallmentStatus('paid', '2026-01-01', '2026-08-15')).toBe('paid')
  })

  it('mantém canceled', () => {
    expect(getEffectiveInstallmentStatus('canceled', '2026-01-01', '2026-08-15')).toBe(
      'canceled'
    )
  })

  it('mantém pending quando ainda não venceu', () => {
    expect(getEffectiveInstallmentStatus('pending', '2026-08-20', '2026-08-15')).toBe('pending')
  })

  it('mantém pending quando vence hoje', () => {
    expect(getEffectiveInstallmentStatus('pending', '2026-08-15', '2026-08-15')).toBe('pending')
  })

  it('deriva overdue quando pending e due_date já passou', () => {
    expect(getEffectiveInstallmentStatus('pending', '2026-08-01', '2026-08-15')).toBe('overdue')
  })

  it('não deriva overdue a partir de status overdue persistido sem pending', () => {
    expect(getEffectiveInstallmentStatus('overdue', '2026-08-01', '2026-08-15')).toBe('overdue')
  })
})
