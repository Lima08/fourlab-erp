import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { CustomerForm } from './CustomerForm'

vi.mock('@/shared/hooks/usePostalCode', () => ({
  usePostalCode: () => ({
    lookupPostalCode: vi.fn().mockResolvedValue({
      street: 'Av. Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    }),
    isLoading: false,
  }),
}))

afterEach(() => {
  cleanup()
})

describe('CustomerForm', () => {
  it('esconde nome fantasia para PF', () => {
    render(<CustomerForm mode="create" onSubmit={vi.fn()} />)
    expect(screen.queryByLabelText(/Nome fantasia/i)).not.toBeInTheDocument()
  })

  it('mostra nome fantasia para PJ', () => {
    render(<CustomerForm mode="create" onSubmit={vi.fn()} />)
    fireEvent.click(screen.getByRole('radio', { name: /Pessoa jurídica/i }))
    expect(screen.getByLabelText(/Nome fantasia/i)).toBeInTheDocument()
  })

  it('bloqueia submit com documento inválido', async () => {
    const onSubmit = vi.fn()

    render(<CustomerForm mode="create" onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Nome completo/i), {
      target: { value: 'Ana Silva' },
    })
    fireEvent.change(screen.getByLabelText(/CPF/i), {
      target: { value: '111.111.111-11' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Cadastrar cliente/i }))

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
    })
    expect(screen.getByText(/CPF inválido/i)).toBeInTheDocument()
  })

  it('aplica máscara de CPF ao digitar', () => {
    render(<CustomerForm mode="create" onSubmit={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/CPF/i), {
      target: { value: '52998224725' },
    })

    expect(screen.getByLabelText(/CPF/i)).toHaveValue('529.982.247-25')
  })
})
