import { useState } from 'react'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import { ClientCombobox } from '@/plataforma/components/usuarios/ClientCombobox'
import { ROLE_LABELS } from '@/plataforma/constants/userLabels'
import { useClientsList } from '@/plataforma/hooks/useClientsList'
import { useProfileMutations } from '@/plataforma/hooks/useProfileMutations'
import {
  userInviteFormSchema,
  type UserFormValues,
} from '@/plataforma/schemas/userFormSchema'
import { formatPhoneInput } from '@/shared/utils/phoneMask'
import type { ProfileRole } from '@/shared/types/profile'

interface Props {
  open: boolean
  onClose: () => void
}

const INPUT_CLS =
  'h-12 w-full rounded-lg border border-industrial-200 bg-white px-4 text-base text-industrial-900 outline-none transition-all placeholder:text-industrial-400 focus:border-safety-blue focus:ring-1 focus:ring-safety-blue'
const LABEL_CLS = 'text-xs font-semibold uppercase tracking-widest text-industrial-500'

const INITIAL_VALUES: UserFormValues = {
  fullName: '',
  email: '',
  phone: '',
  role: 'cliente',
}

export function AddUserModal({ open, onClose }: Props) {
  const { invite, isInviting } = useProfileMutations()
  const {
    data: clients = [],
    isLoading: isLoadingClients,
    isError: isClientsError,
  } = useClientsList(open)
  const [values, setValues] = useState<UserFormValues>(INITIAL_VALUES)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UserFormValues, string>>>(
    {}
  )

  const isClienteRole = values.role === 'cliente'
  const cannotInviteCliente =
    isClienteRole && (isLoadingClients || isClientsError || clients.length === 0)

  const resetForm = () => {
    setValues(INITIAL_VALUES)
    setFieldErrors({})
  }

  const handleClose = () => {
    if (isInviting) return
    resetForm()
    onClose()
  }

  const patchValues = (patch: Partial<UserFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }))
    setFieldErrors({})
  }

  const handleRoleChange = (role: ProfileRole) => {
    patchValues({ role, clientId: undefined })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const result = userInviteFormSchema.safeParse(values)
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
      await invite(result.data)
      resetForm()
      onClose()
    } catch {
      // toast handled in mutation hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] flex-col gap-0 bg-white p-0 sm:max-w-lg"
      >
        <div className="border-industrial-200 flex shrink-0 items-center justify-between border-b px-6 py-4">
          <h2 className="text-industrial-900 text-lg font-bold">Adicionar novo usuário</h2>
          <DialogClose
            render={
              <button
                type="button"
                className="text-industrial-500 hover:bg-industrial-100 flex size-10 items-center justify-center rounded-full transition-colors"
                aria-label="Fechar modal"
                disabled={isInviting}
              />
            }
          >
            <Icon name="close" className="text-[22px]" />
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <div className="space-y-1.5">
              <label htmlFor="add-full-name" className={LABEL_CLS}>
                Nome completo
              </label>
              <input
                id="add-full-name"
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
              <label htmlFor="add-email" className={LABEL_CLS}>
                E-mail
              </label>
              <div className="relative">
                <Icon
                  name="mail"
                  className="text-industrial-400 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px]"
                />
                <input
                  id="add-email"
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
              <label htmlFor="add-phone" className={LABEL_CLS}>
                Telefone
              </label>
              <div className="relative">
                <Icon
                  name="phone"
                  className="text-industrial-400 pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px]"
                />
                <input
                  id="add-phone"
                  type="tel"
                  value={values.phone}
                  onChange={(e) => patchValues({ phone: formatPhoneInput(e.target.value) })}
                  className={`${INPUT_CLS} pl-10`}
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                />
              </div>
              {fieldErrors.phone && <p className="text-xs text-red-600">{fieldErrors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="add-role" className={LABEL_CLS}>
                Função / cargo
              </label>
              <div className="relative">
                <select
                  id="add-role"
                  value={values.role}
                  onChange={(e) => handleRoleChange(e.target.value as ProfileRole)}
                  className={`${INPUT_CLS} appearance-none pr-10`}
                >
                  <option value="cliente">{ROLE_LABELS.cliente}</option>
                  <option value="admin">{ROLE_LABELS.admin}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <Icon name="expand_more" className="text-industrial-400" />
                </div>
              </div>
              {fieldErrors.role && <p className="text-xs text-red-600">{fieldErrors.role}</p>}
            </div>

            {isClienteRole && (
              <div className="space-y-1.5">
                <label htmlFor="add-client" className={LABEL_CLS}>
                  Cliente
                </label>
                <ClientCombobox
                  id="add-client"
                  clients={clients}
                  value={values.clientId}
                  onChange={(clientId) => patchValues({ clientId })}
                  loading={isLoadingClients}
                  loadError={
                    isClientsError
                      ? 'Não foi possível carregar os clientes. Tente novamente.'
                      : undefined
                  }
                  error={fieldErrors.clientId}
                />
              </div>
            )}
          </div>

          <div className="border-industrial-200 bg-industrial-50 flex shrink-0 flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isInviting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isInviting || cannotInviteCliente}>
              {isInviting && <Loader2Icon className="mr-2 size-4 animate-spin" />}+ Adicionar
              usuário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
