import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import HomePage from './HomePage'
import type { DashboardSnapshot } from '@/shared/services/dashboardService'

vi.mock('@/app/dashboard/hooks/useDashboard', () => ({
  useDashboard: vi.fn(),
}))

vi.mock('@/shared/hooks/useConnectivity', () => ({
  useConnectivity: vi.fn(() => ({ isOnline: true })),
}))

vi.mock('@/app/dashboard/hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({ current: null }),
}))

vi.mock('@/app/dashboard/components/SalesEvolutionChart', () => ({
  SalesEvolutionChart: () => <div data-testid="sales-evolution-chart" />,
}))

import { useDashboard } from '@/app/dashboard/hooks/useDashboard'
import { useConnectivity } from '@/shared/hooks/useConnectivity'

const snapshot: DashboardSnapshot = {
  monthKey: '2026-08',
  monthLabel: 'ago/2026',
  financial: {
    received: 10,
    paid: 0,
    balance: 10,
    overdueCount: 0,
    overdueAmount: 0,
  },
  salesMonthTotal: 10,
  salesEvolution: [
    { monthKey: '2026-03', label: 'mar/2026', total: 0 },
    { monthKey: '2026-04', label: 'abr/2026', total: 0 },
    { monthKey: '2026-05', label: 'mai/2026', total: 0 },
    { monthKey: '2026-06', label: 'jun/2026', total: 0 },
    { monthKey: '2026-07', label: 'jul/2026', total: 0 },
    { monthKey: '2026-08', label: 'ago/2026', total: 10 },
  ],
  production: {
    waiting: 1,
    inProduction: 0,
    assembly: 0,
    completed: 0,
    scrap: 0,
  },
  latestApproved: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useConnectivity).mockReturnValue({ isOnline: true })
})

afterEach(() => cleanup())

describe('HomePage', () => {
  it('renderiza os quatro blocos do dashboard', () => {
    vi.mocked(useDashboard).mockReturnValue({
      data: snapshot,
      isLoading: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<HomePage />)

    expect(screen.getByRole('heading', { name: 'Início' })).toBeInTheDocument()
    expect(screen.getByText('Financeiro do mês')).toBeInTheDocument()
    expect(screen.getByText('Vendas')).toBeInTheDocument()
    expect(screen.getByText('Produção')).toBeInTheDocument()
    expect(screen.getByText('Últimos orçamentos aprovados')).toBeInTheDocument()
  })

  it('mostra erro com retry quando falha sem cache', () => {
    const refetch = vi.fn()
    vi.mocked(useDashboard).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      error: new Error('fail'),
      refetch,
    })

    render(<HomePage />)
    fireEvent.click(screen.getByRole('button', { name: /Tentar de novo/i }))
    expect(refetch).toHaveBeenCalled()
  })

  it('mostra banner offline', () => {
    vi.mocked(useConnectivity).mockReturnValue({ isOnline: false })
    vi.mocked(useDashboard).mockReturnValue({
      data: snapshot,
      isLoading: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<HomePage />)
    expect(screen.getByText(/Sem conexão/i)).toBeInTheDocument()
  })
})
