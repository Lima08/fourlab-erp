import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CustomersPage from './CustomersPage'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/app/customers/hooks/useCustomers', () => ({
  useCustomers: vi.fn(),
}))

import { useCustomers } from '@/app/customers/hooks/useCustomers'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CustomersPage', () => {
  it('lista clientes com filtro padrão ativos', () => {
    vi.mocked(useCustomers).mockReturnValue({
      customers: [
        {
          id: 'cust-1',
          customerType: 'pf',
          document: null,
          fullName: 'Ana Silva',
          tradeName: null,
          email: null,
          phone: null,
          zipCode: null,
          street: null,
          number: null,
          complement: null,
          neighborhood: null,
          city: null,
          state: null,
          instagram: null,
          facebook: null,
          linkedin: null,
          website: null,
          notes: null,
          isActive: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-02T00:00:00Z',
        },
      ],
      total: 1,
      totalPages: 1,
      isLoading: false,
      isError: false,
      error: null,
    })

    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    )

    expect(useCustomers).toHaveBeenCalledWith({
      page: 1,
      statusFilter: 'active',
      search: '',
    })
    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
  })

  it('navega para detalhe ao selecionar cliente', () => {
    vi.mocked(useCustomers).mockReturnValue({
      customers: [
        {
          id: 'cust-1',
          customerType: 'pf',
          document: null,
          fullName: 'Ana Silva',
          tradeName: null,
          email: null,
          phone: null,
          zipCode: null,
          street: null,
          number: null,
          complement: null,
          neighborhood: null,
          city: null,
          state: null,
          instagram: null,
          facebook: null,
          linkedin: null,
          website: null,
          notes: null,
          isActive: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-02T00:00:00Z',
        },
      ],
      total: 1,
      totalPages: 1,
      isLoading: false,
      isError: false,
      error: null,
    })

    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ana Silva/i }))
    expect(navigateMock).toHaveBeenCalledWith('/clientes/cust-1')
  })
})
