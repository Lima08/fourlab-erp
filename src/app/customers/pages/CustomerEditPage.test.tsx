import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CustomerEditPage from './CustomerEditPage'

vi.mock('@/app/customers/hooks/useCustomer', () => ({
  useCustomer: vi.fn(),
}))

vi.mock('@/app/customers/hooks/useCustomerMutations', () => ({
  useCustomerMutations: () => ({
    updateCustomer: { mutateAsync: vi.fn(), isPending: false },
  }),
}))

vi.mock('@/shared/hooks/usePostalCode', () => ({
  usePostalCode: () => ({
    lookupPostalCode: vi.fn(),
    isLoading: false,
  }),
}))

import { useCustomer } from '@/app/customers/hooks/useCustomer'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CustomerEditPage', () => {
  it('mostra not-found para id inexistente', () => {
    vi.mocked(useCustomer).mockReturnValue({
      customer: null,
      isLoading: false,
      isError: false,
      isNotFound: true,
    })

    render(
      <MemoryRouter initialEntries={['/clientes/missing/editar']}>
        <Routes>
          <Route path="/clientes/:id/editar" element={<CustomerEditPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/Cliente não encontrado/i)).toBeInTheDocument()
  })
})
