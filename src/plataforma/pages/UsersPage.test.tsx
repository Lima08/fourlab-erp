import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UsersPage from './UsersPage'
import type { Profile } from '@/shared/types/profile'
import type { ProfileCounts, ProfileListResult } from '@/shared/services/profileAdminService'
import { useProfilesList } from '@/plataforma/hooks/useProfilesList'
import { useProfileCounts } from '@/plataforma/hooks/useProfileCounts'
import { useProfileMutations } from '@/plataforma/hooks/useProfileMutations'
import { useClientsList } from '@/plataforma/hooks/useClientsList'
import { useConnectivity } from '@/shared/hooks/useConnectivity'

vi.mock('@/plataforma/hooks/useProfilesList')
vi.mock('@/plataforma/hooks/useProfileCounts')
vi.mock('@/plataforma/hooks/useProfileMutations')
vi.mock('@/plataforma/hooks/useClientsList')
vi.mock('@/shared/hooks/useConnectivity')

const mockUseProfilesList = vi.mocked(useProfilesList)
const mockUseProfileCounts = vi.mocked(useProfileCounts)
const mockUseProfileMutations = vi.mocked(useProfileMutations)
const mockUseClientsList = vi.mocked(useClientsList)
const mockUseConnectivity = vi.mocked(useConnectivity)

const mockInvite = vi.fn()
const mockResend = vi.fn()
const mockUpdate = vi.fn()
const mockUpdateStatus = vi.fn()
const mockRemove = vi.fn()
const mockSendPasswordReset = vi.fn()

const baseProfile: Profile = {
  id: '1',
  fullName: 'Ana Silva',
  email: 'ana@exemplo.com',
  phone: '(11) 98765-4321',
  role: 'cliente',
  status: 'ativo',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const pendingProfile: Profile = {
  ...baseProfile,
  id: '2',
  fullName: 'Bruno Costa',
  email: 'bruno@exemplo.com',
  status: 'convite_pendente',
}

const mockCounts: ProfileCounts = {
  all: 3,
  ativo: 2,
  convite_pendente: 1,
  suspenso: 0,
  admin: 1,
}

const mockListResult: ProfileListResult = {
  profiles: [baseProfile],
  total: 1,
  page: 1,
  pageSize: 10,
  totalPages: 1,
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <UsersPage />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  mockUseConnectivity.mockReturnValue({ isOnline: true })
  mockUseProfileCounts.mockReturnValue({
    data: mockCounts,
    isLoading: false,
  } as ReturnType<typeof useProfileCounts>)
  mockUseProfilesList.mockReturnValue({
    data: mockListResult,
    isLoading: false,
  } as unknown as ReturnType<typeof useProfilesList>)
  mockUseProfileMutations.mockReturnValue({
    invite: mockInvite,
    resend: mockResend,
    update: mockUpdate,
    updateStatus: mockUpdateStatus,
    remove: mockRemove,
    sendPasswordReset: mockSendPasswordReset,
    isInviting: false,
    isResending: false,
    isUpdating: false,
    isUpdatingStatus: false,
    isRemoving: false,
    isSendingPasswordReset: false,
  })
  mockUseClientsList.mockReturnValue({
    data: [{ id: 'client-1', name: 'Condomínio Exemplo' }],
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useClientsList>)
  mockInvite.mockResolvedValue(undefined)
  mockResend.mockResolvedValue(undefined)
  mockUpdate.mockResolvedValue(undefined)
  mockUpdateStatus.mockResolvedValue(undefined)
  mockRemove.mockResolvedValue(undefined)
  mockSendPasswordReset.mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('UsersPage', () => {
  it('exibe cabeçalho com subtítulo de contagens online', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Administração de usuários' })).toBeInTheDocument()
    expect(
      screen.getByText('3 membros na equipe · 2 ativos · 1 com convite pendente.')
    ).toBeInTheDocument()
  })

  it('exibe grid com usuários quando online e há resultados', () => {
    renderPage()

    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerenciar acesso' })).toBeInTheDocument()
  })

  it('exibe empty state quando listagem retorna zero resultados online', () => {
    mockUseProfilesList.mockReturnValue({
      data: { ...mockListResult, profiles: [], total: 0, totalPages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof useProfilesList>)

    renderPage()

    expect(screen.getByText('Nenhum usuário encontrado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument()
    expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument()
  })

  it('reseta busca e filtros ao clicar em Limpar filtros', () => {
    vi.useFakeTimers()

    mockUseProfilesList.mockReturnValue({
      data: { ...mockListResult, profiles: [], total: 0, totalPages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof useProfilesList>)

    renderPage()

    const searchInput = screen.getByLabelText('Buscar usuários')
    fireEvent.change(searchInput, { target: { value: 'inexistente' } })
    vi.advanceTimersByTime(300)

    expect(searchInput).toHaveValue('inexistente')

    fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(screen.getByLabelText('Buscar usuários')).toHaveValue('')

    expect(mockUseProfilesList).toHaveBeenCalledWith(
      expect.objectContaining({ search: '', filter: 'all', page: 1 }),
      true
    )
  })

  it('exibe banner offline, estado indisponível e desabilita Novo usuário offline', () => {
    mockUseConnectivity.mockReturnValue({ isOnline: false })
    mockUseProfileCounts.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useProfileCounts>)
    mockUseProfilesList.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof useProfilesList>)

    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Sem conexão com a internet')
    expect(screen.getByText('Lista indisponível offline')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Novo usuário/i })).toBeDisabled()
    expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument()
  })

  it('zera contagens nos pills quando offline', () => {
    mockUseConnectivity.mockReturnValue({ isOnline: false })
    mockUseProfileCounts.mockReturnValue({
      data: mockCounts,
      isLoading: false,
    } as ReturnType<typeof useProfileCounts>)
    mockUseProfilesList.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof useProfilesList>)

    renderPage()

    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(5)
  })

  it('passa enabled=false aos hooks quando offline', () => {
    mockUseConnectivity.mockReturnValue({ isOnline: false })

    renderPage()

    expect(mockUseProfilesList).toHaveBeenCalledWith(expect.any(Object), false)
    expect(mockUseProfileCounts).toHaveBeenCalledWith(false)
  })

  it('abre modal Adicionar novo usuário ao clicar em Novo usuário', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Novo usuário/i }))

    expect(screen.getByRole('heading', { name: 'Adicionar novo usuário' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toBeInTheDocument()
  })

  it('abre modal Editar usuário pelo menu do cartão', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Opções de Ana Silva/i }))
    fireEvent.click(screen.getByText('Editar usuário'))

    expect(screen.getByRole('heading', { name: 'Editar usuário' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana Silva')
  })

  it('abre dialog de suspensão pelo menu do cartão', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Opções de Ana Silva/i }))
    fireEvent.click(screen.getByText('Suspender acesso'))

    expect(screen.getByRole('heading', { name: 'Suspender acesso' })).toBeInTheDocument()
    expect(
      screen.getByText(/Suspender o acesso de Ana Silva\? O usuário não conseguirá fazer login/i)
    ).toBeInTheDocument()
  })

  it('confirma suspensão via mutation updateStatus', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Opções de Ana Silva/i }))
    fireEvent.click(screen.getByText('Suspender acesso'))
    fireEvent.click(screen.getByRole('button', { name: 'Suspender' }))

    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith({ id: '1', status: 'suspenso' })
    })
  })

  it('abre dialog de remoção pelo menu do cartão', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Opções de Ana Silva/i }))
    fireEvent.click(screen.getByText('Remover usuário'))

    expect(screen.getByRole('heading', { name: 'Remover usuário' })).toBeInTheDocument()
    expect(screen.getByText(/Esta ação não pode ser desfeita/i)).toBeInTheDocument()
  })

  it('confirma remoção via mutation remove', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /Opções de Ana Silva/i }))
    fireEvent.click(screen.getByText('Remover usuário'))
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith('1')
    })
  })

  it('abre modal Gerenciar acesso pelo botão do cartão', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar acesso' }))

    expect(screen.getByRole('heading', { name: 'Gerenciar acesso' })).toBeInTheDocument()
    expect(screen.getByText('Status da conta')).toBeInTheDocument()
    expect(
      screen.getByText('Envie um link de recuperação para o e-mail do usuário.')
    ).toBeInTheDocument()
  })

  it('reenvia convite para usuário com status convite_pendente', async () => {
    mockUseProfilesList.mockReturnValue({
      data: { ...mockListResult, profiles: [pendingProfile] },
      isLoading: false,
    } as unknown as ReturnType<typeof useProfilesList>)

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Reenviar convite' }))

    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledWith('2')
    })
  })

  it('decrementa página após remover último usuário da página', async () => {
    mockUseProfilesList.mockReturnValue({
      data: { ...mockListResult, totalPages: 2 },
      isLoading: false,
    } as unknown as ReturnType<typeof useProfilesList>)

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: /Opções de Ana Silva/i }))
    fireEvent.click(screen.getByText('Remover usuário'))
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith('1')
    })

    await waitFor(() => {
      expect(mockUseProfilesList).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }), true)
    })
  })

  it('mantém a página selecionada após debounce da busca', () => {
    vi.useFakeTimers()

    mockUseProfilesList.mockReturnValue({
      data: { ...mockListResult, total: 15, totalPages: 2 },
      isLoading: false,
    } as unknown as ReturnType<typeof useProfilesList>)

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(mockUseProfilesList).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }), true)

    vi.advanceTimersByTime(300)

    expect(mockUseProfilesList).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, search: '' }),
      true
    )
  })
})
