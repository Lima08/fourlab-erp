import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectProgress } from './ProjectProgress'

describe('ProjectProgress', () => {
  it('exibe progresso parcial com totalItems > 0', () => {
    render(<ProjectProgress completedItems={2} totalItems={5} />)
    expect(screen.getByText('2 / 5 itens')).toBeInTheDocument()
  })

  it('renderiza sem NaN quando totalItems é zero (projeto na nuvem)', () => {
    render(<ProjectProgress completedItems={0} totalItems={0} />)
    expect(screen.getByText('0 / 0 itens')).toBeInTheDocument()
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })
})
