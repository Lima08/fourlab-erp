import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { CustomerStatusActions } from './CustomerStatusActions'

afterEach(() => {
  cleanup()
})

describe('CustomerStatusActions', () => {
  it('confirma inativação do cliente', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)

    render(
      <CustomerStatusActions
        customerName="Ana Silva"
        isActive={true}
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Inativar cliente/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Confirmar$/i }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
  })
})
