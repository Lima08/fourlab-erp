import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { FinancialPulseSection } from './FinancialPulseSection'

afterEach(() => cleanup())

describe('FinancialPulseSection', () => {
  it('exibe métricas e destaque de atrasados', () => {
    render(
      <FinancialPulseSection
        financial={{
          received: 100,
          paid: 40,
          balance: 60,
          overdueCount: 2,
          overdueAmount: 50,
        }}
      />
    )

    expect(screen.getByText('Financeiro do mês')).toBeInTheDocument()
    expect(screen.getByText(/Atrasados/)).toBeInTheDocument()
    expect(screen.getByText(/2 título/)).toBeInTheDocument()
  })

  it('mostra empty quando tudo é zero', () => {
    render(
      <FinancialPulseSection
        financial={{
          received: 0,
          paid: 0,
          balance: 0,
          overdueCount: 0,
          overdueAmount: 0,
        }}
      />
    )

    expect(screen.getByText(/Nenhum movimento financeiro/i)).toBeInTheDocument()
    expect(screen.queryByText(/Atrasados/)).not.toBeInTheDocument()
  })
})
