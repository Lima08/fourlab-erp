export type SaleKind = 'direct' | 'quote'

export type OrderStatus =
  | 'quote'
  | 'approved'
  | 'in_production'
  | 'completed'
  | 'delivered'
  | 'canceled'

const QUOTE_PIPELINE: Partial<Record<OrderStatus, OrderStatus[]>> = {
  quote: ['approved', 'canceled'],
  approved: ['in_production', 'canceled'],
  in_production: ['completed', 'canceled'],
  completed: ['delivered', 'canceled'],
  delivered: ['canceled'],
  canceled: [],
}

const DIRECT_PIPELINE: Partial<Record<OrderStatus, OrderStatus[]>> = {
  approved: ['completed', 'delivered', 'canceled'],
  completed: ['delivered', 'canceled'],
  delivered: ['canceled'],
  canceled: [],
}

export function getAllowedOrderTransitions(
  saleKind: SaleKind,
  current: OrderStatus
): OrderStatus[] {
  const map = saleKind === 'direct' ? DIRECT_PIPELINE : QUOTE_PIPELINE
  return map[current] ?? []
}
