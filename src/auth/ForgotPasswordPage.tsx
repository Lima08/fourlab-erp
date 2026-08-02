import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/shared/db/supabase'
import { Button } from '@/components/ui/button'

const recuperarSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const result = recuperarSchema.safeParse({ email })
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'E-mail inválido')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
      redirectTo: `${window.location.origin}/reset-senha`,
    })
    setLoading(false)

    if (error) {
      toast.error('Erro ao enviar e-mail. Verifique se o endereço está correto.')
      return
    }

    setSucesso(true)
  }

  return (
    <div className="bg-industrial-50 flex min-h-screen items-center justify-center p-4">
      <div className="border-industrial-300 w-full max-w-sm space-y-6 rounded-xl border-2 bg-white p-6 shadow-sm md:p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-industrial-900 text-2xl font-extrabold tracking-tight">
            Recuperar Senha
          </h1>
          <p className="text-industrial-500 text-sm">
            {sucesso
              ? 'Verifique sua caixa de entrada.'
              : 'Enviaremos um link de recuperação para o seu e-mail.'}
          </p>
        </div>

        {sucesso ? (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 text-center text-sm text-green-800">
              Um link de recuperação foi enviado para <strong>{email}</strong>.
            </div>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="h-14 w-full text-base"
            >
              Voltar ao login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-industrial-500 text-xs font-semibold tracking-widest uppercase"
              >
                E-mail cadastrado
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-industrial-400 absolute top-1/2 left-3 -translate-y-1/2 text-[18px]">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-industrial-300 text-industrial-900 placeholder:text-industrial-400 focus:border-industrial-500 w-full rounded-lg border-2 bg-white py-2 pr-3 pl-9 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="h-14 w-full text-base" disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar Link'}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-industrial-500 hover:text-industrial-900 w-full text-center text-sm font-semibold transition-colors"
            >
              Voltar ao login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
