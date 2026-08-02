import { useState } from 'react'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { useProfileMutations } from '@/plataforma/hooks/useProfileMutations'
import type { Profile, ProfileStatus } from '@/shared/types/profile'

interface Props {
  open: boolean
  profile: Profile | null
  onClose: () => void
}

const STATUS_OPTIONS: {
  value: Extract<ProfileStatus, 'ativo' | 'suspenso'>
  label: string
  description: string
  icon: string
}[] = [
  {
    value: 'ativo',
    label: 'Ativo',
    description: 'Acesso total à plataforma',
    icon: 'check_circle',
  },
  {
    value: 'suspenso',
    label: 'Suspenso',
    description: 'Login bloqueado temporariamente',
    icon: 'block',
  },
]

export function ManageAccessModal({ open, profile, onClose }: Props) {
  if (!open || !profile) return null
  return <ManageAccessModalForm key={profile.id} profile={profile} onClose={onClose} />
}

function ManageAccessModalForm({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const { updateStatus, sendPasswordReset, isUpdatingStatus, isSendingPasswordReset } =
    useProfileMutations()
  const [selectedStatus, setSelectedStatus] = useState<
    Extract<ProfileStatus, 'ativo' | 'suspenso'>
  >(() => (profile.status === 'suspenso' ? 'suspenso' : 'ativo'))

  const handleClose = () => {
    if (isUpdatingStatus) return
    onClose()
  }

  const handleSave = async () => {
    if (!profile) return

    if (selectedStatus === profile.status) {
      onClose()
      return
    }

    try {
      await updateStatus({ id: profile.id, status: selectedStatus })
      onClose()
    } catch {
      // toast handled in mutation hook
    }
  }

  const handleResetPassword = async () => {
    if (!profile) return

    try {
      await sendPasswordReset(profile.email)
    } catch {
      // toast handled in mutation hook
    }
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] flex-col gap-0 bg-white p-0 sm:max-w-lg"
      >
        <div className="border-industrial-200 flex shrink-0 items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-industrial-900 text-lg font-bold">Gerenciar acesso</h2>
            <p className="text-industrial-600 text-sm">{profile.fullName}</p>
          </div>
          <DialogClose
            render={
              <button
                type="button"
                className="text-industrial-500 hover:bg-industrial-100 flex size-10 items-center justify-center rounded-full transition-colors"
                aria-label="Fechar modal"
                disabled={isUpdatingStatus}
              />
            }
          >
            <Icon name="close" className="text-[22px]" />
          </DialogClose>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section>
            <h3 className="text-industrial-500 mb-3 text-xs font-semibold tracking-wider uppercase">
              Status da conta
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STATUS_OPTIONS.map((option) => {
                const isActive = selectedStatus === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedStatus(option.value)}
                    className={cn(
                      'flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all',
                      isActive
                        ? 'border-safety-blue ring-safety-blue bg-blue-50 ring-1'
                        : 'border-industrial-200 hover:border-industrial-300 bg-white'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        name={option.icon}
                        className={cn(
                          'text-[20px]',
                          isActive ? 'text-safety-blue' : 'text-industrial-500'
                        )}
                        fill={option.value === 'ativo' && isActive}
                      />
                      <span
                        className={cn(
                          'font-semibold',
                          isActive ? 'text-industrial-900' : 'text-industrial-700'
                        )}
                      >
                        {option.label}
                      </span>
                    </div>
                    <p className="text-industrial-500 mt-1 text-xs">{option.description}</p>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <h3 className="text-industrial-500 mb-3 text-xs font-semibold tracking-wider uppercase">
              Segurança
            </h3>
            <p className="text-industrial-600 mb-3 text-sm">
              Envie um link de recuperação para o e-mail do usuário.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full font-semibold sm:w-auto"
              onClick={handleResetPassword}
              disabled={isSendingPasswordReset}
            >
              {isSendingPasswordReset && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Enviar link de redefinição de senha
            </Button>
          </section>
        </div>

        <div className="border-industrial-200 bg-industrial-50 flex shrink-0 flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isUpdatingStatus}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isUpdatingStatus}>
            {isUpdatingStatus && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
