import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  localStorage.clear()
})

describe('AppSidebar', () => {
  it('renderiza links para início e clientes', () => {
    render(
      <MemoryRouter initialEntries={['/inicio']}>
        <AppSidebar />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /Início/i })).toHaveAttribute('href', '/inicio')
    expect(screen.getByRole('link', { name: /Clientes/i })).toHaveAttribute('href', '/clientes')
  })

  it('marca link ativo com aria-current', () => {
    render(
      <MemoryRouter initialEntries={['/clientes']}>
        <AppSidebar />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /Clientes/i })).toHaveAttribute('aria-current', 'page')
  })

  it('recolhe e expande persistindo em localStorage', () => {
    render(
      <MemoryRouter initialEntries={['/inicio']}>
        <AppSidebar />
      </MemoryRouter>
    )

    const toggle = screen.getByRole('button', { name: /Recolher menu/i })
    fireEvent.click(toggle)

    expect(localStorage.getItem('fourlab.sidebar.collapsed')).toBe('1')
    expect(screen.getByRole('button', { name: /Expandir menu/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Início/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Expandir menu/i }))
    expect(localStorage.getItem('fourlab.sidebar.collapsed')).toBe('0')
  })
})
