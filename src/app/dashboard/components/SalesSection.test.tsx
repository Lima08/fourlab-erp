import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { SalesSection } from './SalesSection'

afterEach(() => cleanup())

describe('SalesSection', () => {
  it('mostra total do mês e o gráfico', () => {
    render(
      <SalesSection
        monthTotal={0}
        evolution={[
          { monthKey: '2026-03', label: 'mar/2026', total: 0 },
          { monthKey: '2026-04', label: 'abr/2026', total: 10 },
          { monthKey: '2026-05', label: 'mai/2026', total: 0 },
          { monthKey: '2026-06', label: 'jun/2026', total: 0 },
          { monthKey: '2026-07', label: 'jul/2026', total: 0 },
          { monthKey: '2026-08', label: 'ago/2026', total: 0 },
        ]}
      />
    )

    expect(screen.getByText('Vendas')).toBeInTheDocument()
    expect(screen.getByText(/Nenhuma venda aprovada/i)).toBeInTheDocument()
    expect(screen.getByTestId('sales-evolution-chart')).toBeInTheDocument()
  })
})
