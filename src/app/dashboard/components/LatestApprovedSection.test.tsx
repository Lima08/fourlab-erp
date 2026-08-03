import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { LatestApprovedSection } from './LatestApprovedSection'

afterEach(() => cleanup())

describe('LatestApprovedSection', () => {
  it('lista itens sem links de navegação', () => {
    render(
      <LatestApprovedSection
        items={[
          {
            id: '1',
            customerName: 'Ana',
            totalAmount: 200,
            approvalDate: '2026-08-10T12:00:00.000Z',
            status: 'approved',
          },
        ]}
      />
    )

    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Aprovado')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('mostra empty state', () => {
    render(<LatestApprovedSection items={[]} />)
    expect(screen.getByText(/Nenhum orçamento aprovado/i)).toBeInTheDocument()
  })
})
