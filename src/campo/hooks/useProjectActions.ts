import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  downloadProject as syncDownload,
  drainQueue,
  pullUpdates,
} from '@/shared/services/sync/syncService'

export function useProjectActions() {
  const navigate = useNavigate()

  const continueInspection = (projectId: string) => {
    navigate(`/campo/vistoria/${projectId}`)
  }

  const downloadProject = async (projectId: string) => {
    const toastId = toast.loading('Baixando projeto...')
    try {
      const result = await syncDownload(projectId)
      if (!result.success) throw new Error(result.error)
      toast.success('Projeto baixado com sucesso', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao baixar projeto', { id: toastId })
    }
  }

  const syncProject = async (projectId: string) => {
    const toastId = toast.loading('Sincronizando...')
    try {
      await drainQueue()
      const result = await pullUpdates(projectId)
      if (!result.success) throw new Error(result.error)
      toast.success('Sincronizado com sucesso', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar', { id: toastId })
    }
  }

  return { continueInspection, downloadProject, syncProject }
}
