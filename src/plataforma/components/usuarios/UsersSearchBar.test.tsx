import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { UsersSearchBar } from './UsersSearchBar'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('UsersSearchBar', () => {
  it('notifica busca com debounce apenas quando o texto muda', () => {
    vi.useFakeTimers()
    const onSearchChange = vi.fn()

    render(<UsersSearchBar onSearchChange={onSearchChange} />)

    vi.advanceTimersByTime(300)
    expect(onSearchChange).toHaveBeenCalledTimes(1)
    expect(onSearchChange).toHaveBeenLastCalledWith('')

    fireEvent.change(screen.getByLabelText('Buscar usuários'), { target: { value: 'ana' } })
    vi.advanceTimersByTime(300)

    expect(onSearchChange).toHaveBeenCalledTimes(2)
    expect(onSearchChange).toHaveBeenLastCalledWith('ana')
  })

  it('não dispara nova busca quando o callback muda sem alterar o texto', () => {
    vi.useFakeTimers()
    const onSearchChange = vi.fn()

    const { rerender } = render(<UsersSearchBar onSearchChange={onSearchChange} />)

    vi.advanceTimersByTime(300)
    expect(onSearchChange).toHaveBeenCalledTimes(1)

    rerender(<UsersSearchBar onSearchChange={vi.fn()} />)
    vi.advanceTimersByTime(300)

    expect(onSearchChange).toHaveBeenCalledTimes(1)
  })
})
