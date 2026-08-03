import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDashboard } from './useDashboard'
import { fetchDashboardSnapshot } from '@/shared/services/dashboardService'
import type { DashboardSnapshot } from '@/shared/services/dashboardService'

vi.mock('@/shared/services/dashboardService', () => ({
  fetchDashboardSnapshot: vi.fn(),
}))

const snapshot: DashboardSnapshot = {
  monthKey: '2026-08',
  monthLabel: 'ago/2026',
  financial: {
    received: 0,
    paid: 0,
    balance: 0,
    overdueCount: 0,
    overdueAmount: 0,
  },
  salesMonthTotal: 0,
  salesEvolution: [],
  production: {
    waiting: 0,
    inProduction: 0,
    assembly: 0,
    completed: 0,
    scrap: 0,
  },
  latestApproved: [],
}

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

describe('useDashboard', () => {
  it('expõe snapshot e estados de carregamento', async () => {
    vi.mocked(fetchDashboardSnapshot).mockResolvedValue(snapshot)

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(snapshot)
    expect(result.current.isError).toBe(false)
    expect(fetchDashboardSnapshot).toHaveBeenCalledOnce()
  })
})
