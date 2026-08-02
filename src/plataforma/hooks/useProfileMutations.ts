import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostgrestError } from '@supabase/supabase-js'
import { toast } from 'sonner'
import type { UserFormValues } from '@/plataforma/schemas/userFormSchema'
import { supabase } from '@/shared/db/supabase'
import {
  deleteProfile,
  mapProfileError,
  updateProfileFields,
  updateProfileStatus,
} from '@/shared/services/profileAdminService'
import { inviteUser, resendInvite, updateUser } from '@/shared/services/profileEdgeService'
import type { Profile, ProfileStatus } from '@/shared/types/profile'

interface UpdateProfilePayload {
  profile: Profile
  values: UserFormValues
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'message' in error
}

function mapMutationError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (isPostgrestError(error)) return mapProfileError(error)
  return 'Operação falhou. Tente novamente.'
}

export function useProfileMutations() {
  const queryClient = useQueryClient()

  const invalidateProfiles = () => {
    void queryClient.invalidateQueries({ queryKey: ['profiles'] })
  }

  const inviteMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const result = await inviteUser({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        role: values.role,
        clientId: values.role === 'cliente' ? values.clientId : undefined,
      })
      if (!result.success) throw new Error(result.error)
    },
    onSuccess: () => {
      invalidateProfiles()
      toast.success('Convite enviado com sucesso')
    },
    onError: (error) => {
      toast.error(mapMutationError(error))
    },
  })

  const resendMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await resendInvite(userId)
      if (!result.success) throw new Error(result.error)
    },
    onSuccess: () => {
      toast.success('Convite reenviado')
    },
    onError: (error) => {
      toast.error(mapMutationError(error))
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ profile, values }: UpdateProfilePayload) => {
      const emailChanged = values.email.trim().toLowerCase() !== profile.email.toLowerCase()

      if (emailChanged) {
        const result = await updateUser({
          userId: profile.id,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          role: values.role,
        })
        if (!result.success) throw new Error(result.error)
        return
      }

      try {
        await updateProfileFields(profile.id, {
          fullName: values.fullName,
          phone: values.phone,
          role: values.role,
        })
      } catch (error) {
        throw new Error(mapMutationError(error), { cause: error })
      }
    },
    onSuccess: () => {
      invalidateProfiles()
      toast.success('Usuário atualizado')
    },
    onError: (error) => {
      toast.error(mapMutationError(error))
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProfileStatus }) => {
      try {
        await updateProfileStatus(id, status)
      } catch (error) {
        throw new Error(mapMutationError(error), { cause: error })
      }
    },
    onSuccess: () => {
      invalidateProfiles()
      toast.success('Status atualizado')
    },
    onError: (error) => {
      toast.error(mapMutationError(error))
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteProfile(id)
      } catch (error) {
        throw new Error(mapMutationError(error), { cause: error })
      }
    },
    onSuccess: () => {
      invalidateProfiles()
      toast.success('Usuário removido')
    },
    onError: (error) => {
      toast.error(mapMutationError(error))
    },
  })

  const sendPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-senha`,
      })
      if (error) {
        throw new Error('Erro ao enviar e-mail. Verifique se o endereço está correto.')
      }
    },
    onSuccess: () => {
      toast.success('Link de redefinição enviado')
    },
    onError: (error) => {
      toast.error(mapMutationError(error))
    },
  })

  return {
    invite: inviteMutation.mutateAsync,
    resend: resendMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    sendPasswordReset: sendPasswordResetMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    isResending: resendMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isRemoving: removeMutation.isPending,
    isSendingPasswordReset: sendPasswordResetMutation.isPending,
  }
}
