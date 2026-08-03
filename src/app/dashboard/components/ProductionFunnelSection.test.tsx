import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ProductionFunnelSection } from './ProductionFunnelSection'

afterEach(() => cleanup())

describe('ProductionFunnelSection', () => {
  it('mostra etapas e sucata à parte', () => {
    render(
      <ProductionFunnelSection
        production={{
          waiting: 2,
          inProduction: 1,
          assembly: 0,
          completed: 3,
          scrap: 1,
        }}
      />
    )

    expect(screen.getByText('Aguardando')).toBeInTheDocument()
    expect(screen.getByText('Em produção')).toBeInTheDocument()
    expect(screen.getByText(/Sucata/)).toBeInTheDocument()
  })
})
