import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CustomerNewPage from './CustomerNewPage'
import { CustomerError } from '@/shared/services/customerService'

const navigateMock = vi.fn()
const mutateAsyncMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/app/customers/hooks/useCustomerMutations', () => ({
  useCustomerMutations: () => ({
    createCustomer: {
      mutateAsync: mutateAsyncMock,
      isPending: false,
    },
  }),
}))

vi.mock('@/shared/hooks/usePostalCode', () => ({
  usePostalCode: () => ({
    lookupPostalCode: vi.fn(),
    isLoading: false,
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CustomerNewPage', () => {
  it('navega para detalhe após criar cliente', async () => {
    mutateAsyncMock.mockResolvedValue({ id: 'cust-1' })

    render(
      <MemoryRouter>
        <CustomerNewPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: 'Ana Silva' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar cliente/i }))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/clientes/cust-1')
    })
  })

  it('mostra erro em conflito de documento', async () => {
    mutateAsyncMock.mockRejectedValue(new CustomerError('DOCUMENT_CONFLICT', 'duplicado'))

    render(
      <MemoryRouter>
        <CustomerNewPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: 'Ana Silva' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar cliente/i }))

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalled()
    })
  })
})
