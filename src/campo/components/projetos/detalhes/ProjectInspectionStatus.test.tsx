import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ProjectInspectionStatus } from './ProjectInspectionStatus'

const baseProps = {
  progressPct: 74,
  completedCount: 35,
  totalCount: 47,
  regularCount: 33,
  pendingCount: 12,
  irregularCount: 2,
  absentCount: 0,
  activeFilter: 'all' as const,
  onFilterChange: vi.fn(),
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProjectInspectionStatus', () => {
  it('exibe progresso e totalizadores', () => {
    render(<ProjectInspectionStatus {...baseProps} />)

    expect(screen.getByText('Status da vistoria')).toBeInTheDocument()
    expect(screen.getByText('74%')).toBeInTheDocument()
    expect(screen.getByText('Vistoriado')).toBeInTheDocument()
    expect(screen.getByText('35/47')).toBeInTheDocument()
    expect(screen.getByText('33')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('dispara onFilterChange ao clicar em Conformes', () => {
    const onFilterChange = vi.fn()
    render(<ProjectInspectionStatus {...baseProps} onFilterChange={onFilterChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Conformes/i }))
    expect(onFilterChange).toHaveBeenCalledWith('regular')
  })

  it('dispara onFilterChange ao clicar em Pendentes', () => {
    const onFilterChange = vi.fn()
    render(<ProjectInspectionStatus {...baseProps} onFilterChange={onFilterChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Pendentes/i }))
    expect(onFilterChange).toHaveBeenCalledWith('pending')
  })

  it('dispara onFilterChange ao clicar em Irregulares', () => {
    const onFilterChange = vi.fn()
    render(<ProjectInspectionStatus {...baseProps} onFilterChange={onFilterChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Irregulares/i }))
    expect(onFilterChange).toHaveBeenCalledWith('irregular')
  })

  it('marca card ativo com aria-pressed', () => {
    render(<ProjectInspectionStatus {...baseProps} activeFilter="pending" />)

    expect(screen.getByRole('button', { name: /Pendentes/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: /Conformes/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })
})
