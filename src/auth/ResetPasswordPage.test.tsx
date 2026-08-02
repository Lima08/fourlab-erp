import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PasswordSetupPage from './PasswordSetupPage'
import { supabase } from '@/shared/db/supabase'
import { activateOwnProfile } from '@/shared/services/profileService'

const navigateMock = vi.fn()
const setUserMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/shared/stores/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (s: { isInitializing: boolean; user: unknown }) => unknown) =>
      selector({ isInitializing: false, user: { id: 'u1' } }),
    {
      getState: () => ({ setUser: setUserMock }),
    }
  ),
}))

vi.mock('@/shared/hooks/useCurrentProfile', () => ({
  useCurrentProfile: () => ({
    isPendingInvite: true,
    isLoading: false,
  }),
}))

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('@/shared/services/profileService', () => ({
  activateOwnProfile: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('PasswordSetupPage', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>)
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.updateUser>>)
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })
  })

  async function submitPassword(buttonLabel: string) {
    fireEvent.change(screen.getByLabelText('Nova Senha'), {
      target: { value: 'senha-forte' },
    })
    fireEvent.change(screen.getByLabelText('Confirmar Nova Senha'), {
      target: { value: 'senha-forte' },
    })
    fireEvent.click(screen.getByRole('button', { name: buttonLabel }))
  }

  it('modo convite exibe copy de ativação e ativa perfil', async () => {
    vi.mocked(activateOwnProfile).mockResolvedValue({ activated: true })

    render(
      <MemoryRouter>
        <PasswordSetupPage mode="invite" />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Defina sua senha' })).toBeInTheDocument()
    })

    await submitPassword('Ativar conta')

    await waitFor(() => {
      expect(activateOwnProfile).toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    })
  })

  it('modo recuperação não ativa perfil', async () => {
    render(
      <MemoryRouter>
        <PasswordSetupPage mode="recovery" />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Nova Senha' })).toBeInTheDocument()
    })

    await submitPassword('Salvar Nova Senha')

    await waitFor(() => {
      expect(activateOwnProfile).not.toHaveBeenCalled()
      expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    })
  })
})
