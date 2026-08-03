import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppBottomNav } from './AppBottomNav'

afterEach(() => {
  cleanup()
})

describe('AppBottomNav', () => {
  it('renderiza navegação inferior com links principais', () => {
    render(
      <MemoryRouter>
        <AppBottomNav />
      </MemoryRouter>
    )

    expect(screen.getByRole('navigation', { name: /Navegação principal/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Início/i })).toHaveAttribute('href', '/inicio')
    expect(screen.getByRole('link', { name: /Clientes/i })).toHaveAttribute('href', '/clientes')
  })
})
