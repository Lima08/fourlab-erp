import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UserMenu } from './UserMenu'
import { PLATFORM_NAV } from '@/shared/navigation/platformNav'
import { isUserManagementEnabled } from '@/shared/config/features'

vi.mock('@/shared/config/features', () => ({
  isUserManagementEnabled: vi.fn(() => true),
}))

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: '/plataforma' }),
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
    profile: { role: 'admin', fullName: 'Ricardo Teixeira' },
    isAdmin: true,
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
  beforeEach(() => {
    vi.mocked(isUserManagementEnabled).mockReturnValue(true)
  })

  it('exibe seção Plataforma com itens de navegação para admin', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ricardo/i }))

    expect(screen.getByText('Plataforma')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Administração de projetos')).toBeInTheDocument()
    expect(screen.getByText('Administração de usuários')).toBeInTheDocument()
  })

  it('oculta Administração de usuários quando gestão de usuários está desativada', () => {
    vi.mocked(isUserManagementEnabled).mockReturnValue(false)

    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ricardo/i }))

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Administração de projetos')).toBeInTheDocument()
    expect(screen.queryByText('Administração de usuários')).not.toBeInTheDocument()
  })

  it('exibe papel do usuário em verde no cabeçalho do menu', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ricardo/i }))

    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('Ricardo Teixeira')).toBeInTheDocument()
  })

  it('exibe Minha conta, Preferências e Sair da conta', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ricardo/i }))

    expect(screen.getByText('Minha conta')).toBeInTheDocument()
    expect(screen.getByText('Preferências')).toBeInTheDocument()
    expect(screen.getByText('Sair da conta')).toBeInTheDocument()
  })

  it('navega para /plataforma ao clicar em Dashboard', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /Ricardo/i }))
    fireEvent.click(screen.getByText('Dashboard'))

    expect(navigateMock).toHaveBeenCalledWith('/plataforma')
  })

  it('aponta Dashboard da plataforma para /plataforma', () => {
    expect(PLATFORM_NAV[0]?.to).toBe('/plataforma')
    expect(PLATFORM_NAV[0]?.isActive('/plataforma')).toBe(true)
  })
})
