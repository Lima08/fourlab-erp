import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/shared/db/supabase'
import { inviteUser, mapEdgeErrorMessage, resendInvite, updateUser } from './profileEdgeService'

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('mapEdgeErrorMessage', () => {
  it('mapeia códigos conhecidos para PT-BR', () => {
    expect(mapEdgeErrorMessage('EMAIL_EXISTS')).toBe('E-mail já cadastrado')
    expect(mapEdgeErrorMessage('NOT_AUTHORIZED')).toBe('Sem permissão')
  })

  it('usa fallback quando código é desconhecido', () => {
    expect(mapEdgeErrorMessage(undefined, 'Erro customizado')).toBe('Erro customizado')
    expect(mapEdgeErrorMessage('UNKNOWN')).toBe('Operação falhou. Tente novamente.')
  })
})

describe('inviteUser', () => {
  it('retorna sucesso com id do usuário convidado', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { id: 'user-new' },
      error: null,
    })

    const result = await inviteUser({
      fullName: 'Maria Souza',
      email: 'maria@example.com',
      phone: '(11) 98765-4321',
    })

    expect(result).toEqual({ success: true, data: { id: 'user-new' } })
    expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
      body: {
        mode: 'create',
        fullName: 'Maria Souza',
        email: 'maria@example.com',
        phone: '(11) 98765-4321',
        redirectTo: `${window.location.origin}/ativar-conta`,
      },
    })
  })

  it('mapeia erro EMAIL_EXISTS', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { error: 'E-mail já cadastrado', code: 'EMAIL_EXISTS' },
      error: { message: 'Edge Function returned a non-2xx status code' },
    } as unknown as Awaited<ReturnType<typeof supabase.functions.invoke>>)

    const result = await inviteUser({
      fullName: 'Maria Souza',
      email: 'maria@example.com',
      phone: '(11) 98765-4321',
    })

    expect(result).toEqual({
      success: false,
      error: 'E-mail já cadastrado',
      code: 'EMAIL_EXISTS',
    })
  })
})

describe('resendInvite', () => {
  it('retorna sucesso ao reenviar convite', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { ok: true },
      error: null,
    })

    const result = await resendInvite('user-pending')

    expect(result).toEqual({ success: true, data: undefined })
    expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
      body: {
        mode: 'resend',
        userId: 'user-pending',
        redirectTo: `${window.location.origin}/ativar-conta`,
      },
    })
  })

  it('mapeia erro INVALID_STATUS', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { error: 'Convite não pendente', code: 'INVALID_STATUS' },
      error: { message: 'Edge Function returned a non-2xx status code' },
    } as unknown as Awaited<ReturnType<typeof supabase.functions.invoke>>)

    const result = await resendInvite('user-active')

    expect(result).toEqual({
      success: false,
      error: 'Convite não pendente',
      code: 'INVALID_STATUS',
    })
  })
})

describe('updateUser', () => {
  it('retorna sucesso ao atualizar usuário', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { ok: true },
      error: null,
    })

    const result = await updateUser({
      userId: 'user-1',
      fullName: 'Ana Silva',
      email: 'ana@example.com',
      phone: '(11) 91234-5678',
    })

    expect(result).toEqual({ success: true, data: undefined })
    expect(supabase.functions.invoke).toHaveBeenCalledWith('update-user', {
      body: {
        userId: 'user-1',
        fullName: 'Ana Silva',
        email: 'ana@example.com',
        phone: '(11) 91234-5678',
      },
    })
  })
})
