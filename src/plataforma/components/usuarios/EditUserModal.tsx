import { useState } from 'react'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/plataforma/constants/userLabels'
import { useProfileMutations } from '@/plataforma/hooks/useProfileMutations'
import { userFormSchema, type UserFormValues } from '@/plataforma/schemas/userFormSchema'
import { formatPhoneInput } from '@/shared/utils/phoneMask'
import type { Profile, ProfileRole } from '@/shared/types/profile'

interface Props {
  open: boolean
  profile: Profile | null
  adminCount: number
  onClose: () => void
}

const INPUT_CLS =
  'h-12 w-full rounded-lg border border-industrial-200 bg-white px-4 text-base text-industrial-900 outline-none transition-all placeholder:text-industrial-400 focus:border-safety-blue focus:ring-1 focus:ring-safety-blue'
const LABEL_CLS = 'text-xs font-semibold uppercase tracking-widest text-industrial-500'

function profileToFormValues(profile: Profile): UserFormValues {
  return {
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone ?? '',
    role: profile.role,
  }
}

export function EditUserModal({ open, profile, adminCount, onClose }: Props) {
  if (!open || !profile) return null
  return (
    <EditUserModalForm
      key={profile.id}
      profile={profile}
      adminCount={adminCount}
      onClose={onClose}
    />
  )
}

function EditUserModalForm({
  profile,
  adminCount,
  onClose,
}: {
  profile: Profile
  adminCount: number
  onClose: () => void
}) {
  const { update, isUpdating } = useProfileMutations()
  const [values, setValues] = useState<UserFormValues>(() => profileToFormValues(profile))
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UserFormValues, string>>>(
    {}
  )

  const isLastAdmin = adminCount === 1 && profile.role === 'admin'
  const isClienteLocked = profile.role === 'cliente'
  const isRoleLocked = isClienteLocked || isLastAdmin

  const handleClose = () => {
    if (isUpdating) return
    onClose()
  }

  const patchValues = (patch: Partial<UserFormValues>) => {
    setValues((prev) => (prev ? { ...prev, ...patch } : prev))
    setFieldErrors({})
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!profile) return

    const result = userFormSchema.safeParse(values)
    if (!result.success) {
      const errors: Partial<Record<keyof UserFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !errors[field as keyof UserFormValues]) {
          errors[field as keyof UserFormValues] = issue.message
        }
      }
      setFieldErrors(errors)
      return
    }

    try {
      await update({ profile, values: result.data })
      onClose()
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
          <h2 className="text-industrial-900 text-lg font-bold">Editar usuário</h2>
          <DialogClose
            render={
              <button
                type="button"
                className="text-industrial-500 hover:bg-industrial-100 flex size-10 items-center justify-center rounded-full transition-colors"
                aria-label="Fechar modal"
                disabled={isUpdating}
              />
            }
          >
            <Icon name="close" className="text-[22px]" />
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div className="space-y-1.5">
              <label htmlFor="edit-full-name" className={LABEL_CLS}>
                Nome completo
              </label>
              <input
                id="edit-full-name"
                type="text"
                value={values.fullName}
                onChange={(e) => patchValues({ fullName: e.target.value })}
                className={INPUT_CLS}
                autoComplete="name"
              />
              {fieldErrors.fullName && (
                <p className="text-xs text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-email" className={LABEL_CLS}>
                E-mail
              </label>
              <div className="relative">
                <Icon
                  name="mail"
                  className="text-industrial-400 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px]"
                />
                <input
                  id="edit-email"
                  type="email"
                  value={values.email}
                  onChange={(e) => patchValues({ email: e.target.value })}
                  className={`${INPUT_CLS} pl-10`}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && <p className="text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-phone" className={LABEL_CLS}>
                Telefone
              </label>
              <div className="relative">
                <Icon
                  name="phone"
                  className="text-industrial-400 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px]"
                />
                <input
                  id="edit-phone"
                  type="tel"
                  value={values.phone}
                  onChange={(e) => patchValues({ phone: formatPhoneInput(e.target.value) })}
                  className={`${INPUT_CLS} pl-10`}
                  autoComplete="tel"
                />
              </div>
              {fieldErrors.phone && <p className="text-xs text-red-600">{fieldErrors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-role" className={LABEL_CLS}>
                Função / cargo
              </label>
              <div className="relative">
                <select
                  id="edit-role"
                  value={values.role}
                  onChange={(e) => patchValues({ role: e.target.value as ProfileRole })}
                  disabled={isRoleLocked}
                  className={cn(
                    `${INPUT_CLS} appearance-none pr-10`,
                    isRoleLocked && 'bg-industrial-50 text-industrial-500 cursor-not-allowed'
                  )}
                >
                  <option value="cliente">{ROLE_LABELS.cliente}</option>
                  <option value="admin">{ROLE_LABELS.admin}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <Icon name="expand_more" className="text-industrial-400" />
                </div>
              </div>
              {fieldErrors.role && <p className="text-xs text-red-600">{fieldErrors.role}</p>}
              {isClienteLocked && (
                <p className="text-industrial-600 flex items-start gap-1.5 text-xs">
                  <Icon name="lock" className="text-industrial-500 mt-0.5 shrink-0 text-[16px]" />
                  Um cliente não pode ser promovido a administrador.
                </p>
              )}
              {isLastAdmin && (
                <p className="text-industrial-600 flex items-start gap-1.5 text-xs">
                  <Icon name="lock" className="text-industrial-500 mt-0.5 shrink-0 text-[16px]" />
                  Não é possível — este é o único administrador.
                </p>
              )}
            </div>
          </div>

          <div className="border-industrial-200 bg-industrial-50 flex shrink-0 flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Salvar alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
