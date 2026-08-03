import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCustomerMutations } from './useCustomerMutations'
import { createCustomer } from '@/shared/services/customerService'

vi.mock('@/shared/services/customerService', () => ({
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  setCustomerActive: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useCustomerMutations', () => {
  it('executa createCustomer via mutation', async () => {
    vi.mocked(createCustomer).mockResolvedValue({
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
    })

    const { result } = renderHook(() => useCustomerMutations(), { wrapper: createWrapper() })

    await result.current.createCustomer.mutateAsync({
      customerType: 'pf',
      fullName: 'Ana Silva',
    })

    expect(createCustomer).toHaveBeenCalledWith({
      customerType: 'pf',
      fullName: 'Ana Silva',
    })
  })
})
