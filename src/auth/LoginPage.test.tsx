import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import { supabase } from '@/shared/db/supabase'
import { fetchOwnProfile } from '@/shared/services/profileService'
import { isUserManagementEnabled } from '@/shared/config/features'

vi.mock('@/shared/config/features', () => ({
  isUserManagementEnabled: vi.fn(() => true),
}))

const navigateMock = vi.fn()
const setUserMock = vi.fn()
const signOutMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/shared/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ setUser: setUserMock }),
  },
}))

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('@/shared/services/profileService', () => ({
  fetchOwnProfile: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(isUserManagementEnabled).mockReturnValue(true)
    vi.mocked(supabase.auth.signOut).mockImplementation(
      signOutMock.mockResolvedValue({ error: null })
    )
  })

  async function submitLogin() {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText('E-mail'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'senha123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  }

  it('redireciona admin ativo para /plataforma', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>)
    vi.mocked(fetchOwnProfile).mockResolvedValue({
      id: 'u1',
      fullName: 'Admin',
      email: 'user@example.com',
      phone: null,
      role: 'admin',
      status: 'ativo',
      createdAt: '',
      updatedAt: '',
    })

    await submitLogin()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/plataforma')
    })
  })

  it('redireciona admin ativo para /campo quando gestão de usuários está desativada', async () => {
    vi.mocked(isUserManagementEnabled).mockReturnValue(false)
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>)
    vi.mocked(fetchOwnProfile).mockResolvedValue({
      id: 'u1',
      fullName: 'Admin',
      email: 'user@example.com',
      phone: null,
      role: 'admin',
      status: 'ativo',
      createdAt: '',
      updatedAt: '',
    })

    await submitLogin()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/campo')
    })
  })

  it('redireciona cliente ativo para /campo', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: { user: { id: 'u2' } } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>)
    vi.mocked(fetchOwnProfile).mockResolvedValue({
      id: 'u2',
      fullName: 'Técnico',
      email: 'user@example.com',
      phone: null,
      role: 'cliente',
      status: 'ativo',
      createdAt: '',
      updatedAt: '',
    })

    await submitLogin()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/campo')
    })
  })

  it('bloqueia login com convite pendente sem ativar perfil', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: { user: { id: 'u3' } } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>)
    vi.mocked(fetchOwnProfile).mockResolvedValue({
      id: 'u3',
      fullName: 'Convidado',
      email: 'user@example.com',
      phone: null,
      role: 'cliente',
      status: 'convite_pendente',
      createdAt: '',
      updatedAt: '',
    })

    await submitLogin()

    await waitFor(() => {
      expect(screen.getByText(/Conta ainda não ativada/i)).toBeInTheDocument()
    })
    expect(signOutMock).toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('bloqueia login de conta suspensa', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: { user: { id: 'u4' } } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>)
    vi.mocked(fetchOwnProfile).mockResolvedValue({
      id: 'u4',
      fullName: 'Suspenso',
      email: 'user@example.com',
      phone: null,
      role: 'cliente',
      status: 'suspenso',
      createdAt: '',
      updatedAt: '',
    })

    await submitLogin()

    await waitFor(() => {
      expect(screen.getByText(/Conta suspensa/i)).toBeInTheDocument()
    })
    expect(signOutMock).toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('libera botão Entrar quando fetchOwnProfile falha', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: { user: { id: 'u5' } } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>)
    vi.mocked(fetchOwnProfile).mockRejectedValue(new Error('network'))

    await submitLogin()

    await waitFor(() => {
      expect(screen.getByText(/Não foi possível carregar seu perfil/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Entrar' })).not.toBeDisabled()
    })
    expect(signOutMock).toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
