import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { DashboardHeader } from './DashboardHeader'
import { DashboardErrorState } from './DashboardErrorState'
import { DashboardOfflineBanner } from './DashboardOfflineBanner'

afterEach(() => cleanup())

describe('Dashboard shell chrome', () => {
  it('header dispara atualização', () => {
    const onRefresh = vi.fn()
    render(<DashboardHeader monthLabel="ago/2026" onRefresh={onRefresh} isRefreshing={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Atualizar dashboard/i }))
    expect(onRefresh).toHaveBeenCalledOnce()
  })

  it('erro oferecee retry', () => {
    const onRetry = vi.fn()
    render(<DashboardErrorState onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /Tentar de novo/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('mostra banner offline', () => {
    render(<DashboardOfflineBanner />)
    expect(screen.getByText(/Sem conexão/i)).toBeInTheDocument()
  })
})
