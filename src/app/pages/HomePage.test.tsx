import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import HomePage from './HomePage'

afterEach(() => {
  cleanup()
})

describe('HomePage', () => {
  it('descreve o ERP de produtos impressos em 3D sem mencionar venda de impressoras', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: /Fourlab ERP/i })).toBeInTheDocument()
    expect(screen.getByText(/produtos impressos/i)).toBeInTheDocument()
    expect(screen.getByText(/PLA/i)).toBeInTheDocument()
    expect(screen.getByText(/PETG/i)).toBeInTheDocument()
    expect(screen.getByText(/ABS/i)).toBeInTheDocument()
    expect(screen.queryByText(/vende impressoras/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/venda de impressoras/i)).not.toBeInTheDocument()
  })
})
