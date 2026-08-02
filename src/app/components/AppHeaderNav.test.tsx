import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppHeaderNav } from './AppHeaderNav'

afterEach(() => {
  cleanup()
})

describe('AppHeaderNav', () => {
  it('renderiza links para início e clientes', () => {
    render(
      <MemoryRouter initialEntries={['/inicio']}>
        <AppHeaderNav />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /Início/i })).toHaveAttribute('href', '/inicio')
    expect(screen.getByRole('link', { name: /Clientes/i })).toHaveAttribute('href', '/clientes')
  })

  it('marca link ativo com aria-current', () => {
    render(
      <MemoryRouter initialEntries={['/clientes']}>
        <AppHeaderNav />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /Clientes/i })).toHaveAttribute('aria-current', 'page')
  })
})
