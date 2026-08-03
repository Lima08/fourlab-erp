import { describe, expect, it } from 'vitest'
import { getAllowedOrderTransitions } from './orderTransitions'

describe('getAllowedOrderTransitions', () => {
  it('para venda direta a partir de approved permite completed, delivered e canceled', () => {
    expect(getAllowedOrderTransitions('direct', 'approved')).toEqual([
      'completed',
      'delivered',
      'canceled',
    ])
  })

  it('para venda direta não oferece in_production nem quote', () => {
    const next = getAllowedOrderTransitions('direct', 'completed')
    expect(next).not.toContain('in_production')
    expect(next).not.toContain('quote')
    expect(next).toEqual(['delivered', 'canceled'])
  })

  it('para orçamento segue o pipeline a partir de quote', () => {
    expect(getAllowedOrderTransitions('quote', 'quote')).toEqual(['approved', 'canceled'])
  })

  it('para orçamento em approved permite in_production e canceled', () => {
    expect(getAllowedOrderTransitions('quote', 'approved')).toEqual([
      'in_production',
      'canceled',
    ])
  })

  it('para orçamento em in_production permite completed e canceled', () => {
    expect(getAllowedOrderTransitions('quote', 'in_production')).toEqual([
      'completed',
      'canceled',
    ])
  })

  it('não permite transição a partir de canceled', () => {
    expect(getAllowedOrderTransitions('direct', 'canceled')).toEqual([])
    expect(getAllowedOrderTransitions('quote', 'canceled')).toEqual([])
  })

  it('delivered só permite canceled', () => {
    expect(getAllowedOrderTransitions('direct', 'delivered')).toEqual(['canceled'])
    expect(getAllowedOrderTransitions('quote', 'delivered')).toEqual(['canceled'])
  })
})
