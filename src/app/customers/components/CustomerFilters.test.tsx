import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { CustomerFilters } from './CustomerFilters'

afterEach(() => {
  cleanup()
})

describe('CustomerFilters', () => {
  it('renderiza filtros de status e dispara callback', () => {
    const onFilterChange = vi.fn()

    render(
      <CustomerFilters
        activeFilter="active"
        counts={{ active: 3, inactive: 1, all: 4 }}
        onFilterChange={onFilterChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Inativos/i }))
    expect(onFilterChange).toHaveBeenCalledWith('inactive')
  })
})
