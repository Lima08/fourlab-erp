import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { usePendingInviteRedirect } from './usePendingInviteRedirect'

vi.mock('@/shared/stores/authStore', () => ({
  useAuthStore: (selector: (s: { user: unknown; isInitializing: boolean }) => unknown) =>
    selector({ user: { id: 'u1' }, isInitializing: false }),
}))

vi.mock('@/shared/hooks/useConnectivity', () => ({
  useConnectivity: vi.fn(() => ({ isOnline: true })),
}))

import { useConnectivity } from '@/shared/hooks/useConnectivity'

const useCurrentProfileMock = vi.fn()

vi.mock('@/shared/hooks/useCurrentProfile', () => ({
  useCurrentProfile: () => useCurrentProfileMock(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('usePendingInviteRedirect', () => {
  it('redireciona quando convite está pendente', () => {
    useCurrentProfileMock.mockReturnValue({
      profile: { isActive: false, activatedAt: null },
      isPendingInvite: true,
      isDeactivated: false,
      isLoading: false,
      isError: false,
    })

    const { result } = renderHook(() => usePendingInviteRedirect())

    expect(result.current.shouldRedirectToActivateAccount).toBe(true)
  })

  it('redireciona quando perfil é null online (fail-closed)', () => {
    useCurrentProfileMock.mockReturnValue({
      profile: null,
      isPendingInvite: false,
      isDeactivated: false,
      isLoading: false,
      isError: false,
    })

    const { result } = renderHook(() => usePendingInviteRedirect())

    expect(result.current.shouldRedirectToActivateAccount).toBe(true)
  })

  it('não redireciona para ativação quando a query do perfil falha', () => {
    useCurrentProfileMock.mockReturnValue({
      profile: null,
      isPendingInvite: false,
      isDeactivated: false,
      isLoading: false,
      isError: true,
    })

    const { result } = renderHook(() => usePendingInviteRedirect())

    expect(result.current.shouldRedirectToActivateAccount).toBe(false)
  })

  it('não trata conta desativada como convite pendente', () => {
    useCurrentProfileMock.mockReturnValue({
      profile: { isActive: false, activatedAt: '2026-01-01T00:00:00Z' },
      isPendingInvite: false,
      isDeactivated: true,
      isLoading: false,
      isError: false,
    })

    const { result } = renderHook(() => usePendingInviteRedirect())

    expect(result.current.shouldRedirectToActivateAccount).toBe(false)
    expect(result.current.isDeactivated).toBe(true)
  })

  it('não redireciona usuário ativo com perfil carregado', () => {
    vi.mocked(useConnectivity).mockReturnValue({ isOnline: true })
    useCurrentProfileMock.mockReturnValue({
      profile: { isActive: true, activatedAt: '2026-01-01T00:00:00Z' },
      isPendingInvite: false,
      isDeactivated: false,
      isLoading: false,
      isError: false,
    })

    const { result } = renderHook(() => usePendingInviteRedirect())

    expect(result.current.shouldRedirectToActivateAccount).toBe(false)
  })

  it('não redireciona offline quando perfil ainda não carregou', () => {
    vi.mocked(useConnectivity).mockReturnValue({ isOnline: false })
    useCurrentProfileMock.mockReturnValue({
      profile: null,
      isPendingInvite: false,
      isDeactivated: false,
      isLoading: false,
      isError: true,
    })

    const { result } = renderHook(() => usePendingInviteRedirect())

    expect(result.current.shouldRedirectToActivateAccount).toBe(false)
  })
})
