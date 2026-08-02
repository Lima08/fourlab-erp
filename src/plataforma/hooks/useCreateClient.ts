import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient, type CreateClientInput } from '@/shared/services/clientService'

export function useCreateClient() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (values: CreateClientInput) => createClient(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente criado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao criar cliente. Tente novamente.')
    },
  })

  return {
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
