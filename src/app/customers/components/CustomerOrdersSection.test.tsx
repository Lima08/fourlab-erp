import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CustomerOrdersSection } from './CustomerOrdersSection'

afterEach(() => {
  cleanup()
})

describe('CustomerOrdersSection', () => {
  it('mostra empty state quando não há pedidos', () => {
    render(<CustomerOrdersSection orders={[]} isLoading={false} />)
    expect(screen.getByText(/Nenhum pedido registrado/i)).toBeInTheDocument()
  })

  it('lista pedidos com data, status e total', () => {
    render(
      <CustomerOrdersSection
        orders={[
          {
            id: 'order-1',
            status: 'approved',
            totalAmount: 1500,
            issueDate: '2026-02-01T00:00:00Z',
          },
        ]}
        isLoading={false}
      />
    )

    expect(screen.getByText(/Aprovado/i)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s?1\.500,00/)).toBeInTheDocument()
  })
})
