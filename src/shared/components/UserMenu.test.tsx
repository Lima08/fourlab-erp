import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserMenu } from './UserMenu'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/shared/stores/authStore', () => ({
  useAuthStore: (selector: (s: { user: unknown }) => unknown) =>
    selector({
      user: { email: 'admin@exemplo.com', user_metadata: { full_name: 'Ricardo Teixeira' } },
    }),
}))

vi.mock('@/shared/hooks/useCurrentProfile', () => ({
  useCurrentProfile: () => ({
    profile: { fullName: 'Ricardo Teixeira', isActive: true },
  }),
}))

vi.mock('@/shared/db/supabase', () => ({
  supabase: { auth: { signOut: vi.fn().mockResolvedValue({ error: null }) } },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('UserMenu', () => {
  it('exibe nome e e-mail no cabeçalho do menu', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ricardo/i }))

    expect(screen.getByText('Ricardo Teixeira')).toBeInTheDocument()
    expect(screen.getByText('admin@exemplo.com')).toBeInTheDocument()
  })

  it('exibe Sair da conta', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ricardo/i }))

    expect(screen.getByText('Sair da conta')).toBeInTheDocument()
  })

  it('faz logout e navega para /login', async () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ricardo/i }))
    fireEvent.click(screen.getByText('Sair da conta'))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    })
  })
})
