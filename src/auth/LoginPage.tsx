import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { supabase } from '@/shared/db/supabase'
import { fetchOwnProfile } from '@/shared/services/profileService'
import { getAuthHomePath } from '@/shared/navigation/getAuthHomePath'
import { useAuthStore } from '@/shared/stores/authStore'
import { useBootSplashState } from '@/shared/components/bootSplashContext'
import { queryClient } from '@/shared/providers/queryClient'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha muito curta'),
})

async function signOutAndClearSession() {
  await supabase.auth.signOut()
  useAuthStore.getState().setUser(null)
  queryClient.removeQueries({ queryKey: ['profile'] })
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { show: bootShow, fading: bootFading, logoLanded } = useBootSplashState()
  const revealForm = !bootShow || bootFading
  const showLoginLogo = !bootShow || logoLanded
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Dados inválidos')
      return
    }

    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: result.data.email,
        password: result.data.password,
      })

      if (authError) {
        setError('Credenciais inválidas')
        return
      }

      if (!data.session?.user) {
        return
      }

      useAuthStore.getState().setUser(data.session.user)

      let profile
      try {
        profile = await fetchOwnProfile()
      } catch {
        await signOutAndClearSession()
        setError('Não foi possível carregar seu perfil. Tente novamente.')
        return
      }

      if (profile?.status === 'convite_pendente') {
        await signOutAndClearSession()
        setError('Conta ainda não ativada. Use o link do convite ou fale com o administrador.')
        return
      }

      if (profile?.status === 'suspenso') {
        await signOutAndClearSession()
        setError('Conta suspensa. Entre em contato com o administrador.')
        return
      }

      if (!profile) {
        await signOutAndClearSession()
        setError('Perfil não encontrado. Fale com o administrador.')
        return
      }

      queryClient.setQueryData(['profile', 'current', data.session.user.id], profile)

      navigate(getAuthHomePath(profile.role))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-industrial-50 p-4">
      {/* Card estático (sem translate) — o slot do logo precisa de posição fixa para o voo pousar sem piscar */}
      <div className="w-full max-w-sm space-y-6 rounded-xl border-2 border-industrial-300 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-1 text-center">
          <img
            data-login-logo
            src="/icons/icon-192.png"
            alt=""
            width={48}
            height={48}
            className={cn(
              'mx-auto mb-3 size-12 rounded-xl object-cover shadow-sm',
              showLoginLogo ? 'opacity-100' : 'opacity-0',
            )}
          />
          <div
            className={cn(
              'space-y-1',
              revealForm ? 'animate-login-reveal' : 'opacity-0',
            )}
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-industrial-400">
              Kadu
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-industrial-900">
              Vistoria Técnica
            </h1>
            <p className="text-sm text-industrial-500">Entre com sua conta para continuar</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={cn('space-y-4', revealForm ? 'animate-login-reveal' : 'opacity-0')}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-industrial-500 text-xs font-semibold tracking-widest uppercase"
            >
              E-mail
            </label>
            <div className="relative">
              <span className="material-symbols-outlined text-industrial-400 absolute top-1/2 left-3 -translate-y-1/2 text-[18px]">
                mail
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-industrial-300 text-industrial-900 placeholder:text-industrial-400 focus:border-industrial-500 h-12 w-full rounded-lg border-2 bg-white py-2 pr-3 pl-9 text-base focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-industrial-500 text-xs font-semibold tracking-widest uppercase"
            >
              Senha
            </label>
            <div className="relative">
              <span className="material-symbols-outlined text-industrial-400 absolute top-1/2 left-3 -translate-y-1/2 text-[18px]">
                lock
              </span>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-industrial-300 text-industrial-900 placeholder:text-industrial-400 focus:border-industrial-500 h-12 w-full rounded-lg border-2 bg-white py-2 pr-3 pl-9 text-base focus:outline-none"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => navigate('/recuperar-senha')}
              className="text-industrial-500 hover:text-industrial-900 text-xs font-semibold transition-colors hover:underline focus:outline-none"
            >
              Esqueci minha senha
            </button>
          </div>

          {error && (
            <p className="text-destructive flex items-center gap-1.5 text-sm">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}

          <Button type="submit" className="h-14 w-full text-base" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
