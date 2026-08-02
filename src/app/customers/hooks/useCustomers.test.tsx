import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCustomers } from './useCustomers'
import { listCustomers } from '@/shared/services/customerService'

vi.mock('@/shared/services/customerService', () => ({
  listCustomers: vi.fn(),
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

describe('useCustomers', () => {
  it('carrega clientes com parâmetros de listagem', async () => {
    vi.mocked(listCustomers).mockResolvedValue({
      rows: [
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
    })

    const { result } = renderHook(
      () => useCustomers({ page: 1, statusFilter: 'active', search: 'ana' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(listCustomers).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: 'active',
      search: 'ana',
    })
    expect(result.current.customers).toHaveLength(1)
    expect(result.current.totalPages).toBe(1)
  })
})
