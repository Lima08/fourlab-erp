import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createProject, type CreateProjectInput } from '@/plataforma/services/projectService'

export function useCreateProject() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (values: CreateProjectInput) => createProject(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto criado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao criar projeto. Tente novamente.')
    },
  })

  return {
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}
