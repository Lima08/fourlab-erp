import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { CustomerEmptyState } from './CustomerEmptyState'

afterEach(() => {
  cleanup()
})

describe('CustomerEmptyState', () => {
  it('mostra mensagem para lista vazia sem busca', () => {
    render(<CustomerEmptyState hasSearch={false} />)
    expect(screen.getByText(/Nenhum cliente cadastrado/i)).toBeInTheDocument()
  })

  it('mostra mensagem para busca sem resultados', () => {
    render(<CustomerEmptyState hasSearch={true} />)
    expect(screen.getByText(/Nenhum cliente encontrado/i)).toBeInTheDocument()
  })
})
