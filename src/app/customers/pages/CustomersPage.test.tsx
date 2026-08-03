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

vi.mock('@/app/customers/hooks/useCustomerCounts', () => ({
  useCustomerCounts: vi.fn(),
}))

import { useCustomers } from '@/app/customers/hooks/useCustomers'
import { useCustomerCounts } from '@/app/customers/hooks/useCustomerCounts'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const customerAna = {
  id: 'cust-1',
  customerType: 'pf' as const,
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
}

function mockCustomersSuccess() {
  vi.mocked(useCustomers).mockReturnValue({
    customers: [customerAna],
    total: 1,
    totalPages: 1,
    isLoading: false,
    isError: false,
    error: null,
  })
  vi.mocked(useCustomerCounts).mockReturnValue({
    counts: { active: 3, inactive: 1, all: 4 },
    isLoading: false,
    isError: false,
  })
}

describe('CustomersPage', () => {
  it('lista clientes com filtro padrão ativos', () => {
    mockCustomersSuccess()

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
    expect(screen.getByRole('button', { name: /Inativos/i })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: /Todos/i })).toHaveTextContent('4')
  })

  it('navega para detalhe ao selecionar cliente', () => {
    mockCustomersSuccess()

    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ana Silva/i }))
    expect(navigateMock).toHaveBeenCalledWith('/clientes/cust-1')
  })

  it('mostra erro quando a listagem falha', () => {
    vi.mocked(useCustomers).mockReturnValue({
      customers: [],
      total: 0,
      totalPages: 1,
      isLoading: false,
      isError: true,
      error: new Error('boom'),
    })
    vi.mocked(useCustomerCounts).mockReturnValue({
      counts: { active: 0, inactive: 0, all: 0 },
      isLoading: false,
      isError: false,
    })

    render(
      <MemoryRouter>
        <CustomersPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os clientes. Tente novamente.'
    )
    expect(screen.queryByText(/Nenhum cliente/i)).not.toBeInTheDocument()
  })
})
