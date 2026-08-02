import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/shared/db/supabase'
import { useCurrentProfile } from '@/shared/hooks/useCurrentProfile'
import { activateOwnProfile } from '@/shared/services/profileService'
import { useAuthStore } from '@/shared/stores/authStore'
import { queryClient } from '@/shared/providers/queryClient'
import { Button } from '@/components/ui/button'

export type PasswordSetupMode = 'invite' | 'recovery'

const resetSchema = z
  .object({
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

function hasAuthTokensInUrl(): boolean {
  const hash = window.location.hash
  const search = window.location.search
  return hash.includes('access_token') || search.includes('code=')
}

interface PasswordSetupPageProps {
  mode: PasswordSetupMode
}

export default function PasswordSetupPage({ mode }: PasswordSetupPageProps) {
  const navigate = useNavigate()
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const user = useAuthStore((s) => s.user)
  const { isPendingInvite, isLoading: isProfileLoading } = useCurrentProfile()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  const isInviteMode = mode === 'invite'

  useEffect(() => {
    if (isInitializing) return

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session || hasAuthTokensInUrl()) {
        setSessionReady(true)
        return
      }

      toast.error(
        isInviteMode
          ? 'Sessão de convite inválida ou expirada.'
          : 'Sessão de recuperação inválida ou expirada.'
      )
      navigate('/login', { replace: true })
    })
  }, [isInitializing, isInviteMode, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = resetSchema.safeParse({ password, confirmPassword })
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Dados inválidos')
      return
    }

    setLoading(true)

    const { error: passwordError } = await supabase.auth.updateUser({
      password: result.data.password,
    })

    if (passwordError) {
      setLoading(false)
      toast.error('Erro ao atualizar a senha. Tente solicitar um novo link.')
      return
    }

    if (isInviteMode) {
      const { error: activateError, activated } = await activateOwnProfile()
      if (activateError) {
        setLoading(false)
        toast.error('Senha definida, mas não foi possível ativar sua conta. Tente novamente.')
        return
      }

      if (!activated && isPendingInvite) {
        setLoading(false)
        toast.error('Não foi possível ativar sua conta. Tente novamente.')
        return
      }
    }

    await supabase.auth.signOut()
    useAuthStore.getState().setUser(null)
    queryClient.removeQueries({ queryKey: ['profile'] })
    setLoading(false)

    toast.success('Senha definida com sucesso! Faça login para continuar.')
    navigate('/login', { replace: true })
  }

  if (isInitializing || !sessionReady || (user && isProfileLoading)) {
    return (
      <div className="bg-industrial-50 flex min-h-screen items-center justify-center p-4">
        <p className="text-industrial-500 text-sm">Carregando…</p>
      </div>
    )
  }

  const title = isInviteMode ? 'Defina sua senha' : 'Nova Senha'
  const description = isInviteMode
    ? 'Crie uma senha de acesso para ativar sua conta.'
    : 'Crie uma nova senha de acesso forte.'
  const submitLabel = isInviteMode ? 'Ativar conta' : 'Salvar Nova Senha'

  return (
    <div className="bg-industrial-50 flex min-h-screen items-center justify-center p-4">
      <div className="border-industrial-300 w-full max-w-sm space-y-6 rounded-xl border-2 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-industrial-900 text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-industrial-500 text-sm">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-industrial-500 text-xs font-semibold tracking-widest uppercase"
            >
              Nova Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined text-industrial-400 absolute top-1/2 left-3 -translate-y-1/2 text-[18px]">
                lock
              </span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-industrial-300 text-industrial-900 placeholder:text-industrial-400 focus:border-industrial-500 w-full rounded-lg border-2 bg-white py-2 pr-3 pl-9 text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-industrial-500 text-xs font-semibold tracking-widest uppercase"
            >
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined text-industrial-400 absolute top-1/2 left-3 -translate-y-1/2 text-[18px]">
                lock_reset
              </span>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-industrial-300 text-industrial-900 placeholder:text-industrial-400 focus:border-industrial-500 w-full rounded-lg border-2 bg-white py-2 pr-3 pl-9 text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          <Button type="submit" className="mt-2 h-14 w-full text-base" disabled={loading}>
            {loading ? 'Salvando…' : submitLabel}
          </Button>
        </form>
      </div>
    </div>
  )
}
