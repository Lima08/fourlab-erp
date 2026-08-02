import { useState } from 'react'
import { toast } from 'sonner'
import type { Project } from '@/shared/db/dexie'
import type { RemoteOnlyItem } from '@/shared/services/sync/syncService'
import {
  deleteLocalProjectData,
  findSyncConflicts,
  getProjectDeleteStatus,
  markProjectSynced,
  pullRemoteItems,
  pullUpdates,
  drainQueue,
  syncProjectList,
  checkForUpdates,
  downloadProjectMedia,
} from '@/shared/services/sync/syncService'
import { enqueueItemDelete } from '@/shared/services/sync/queueProcessor'

export type DeleteDialogState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'ready'; existsRemotely: boolean; hasPendingChanges: boolean }
  | { phase: 'deleting' }

export type SyncDialogState =
  | { phase: 'idle' }
  | { phase: 'syncing' }
  | { phase: 'conflicts'; items: RemoteOnlyItem[] }

export function useProjectMenuActions(project: Project, isOnline: boolean) {
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({ phase: 'idle' })
  const [syncDialog, setSyncDialog] = useState<SyncDialogState>({ phase: 'idle' })
  const [isSyncAble, setIsSyncAble] = useState(false)

  const openDeleteDialog = async () => {
    if (!isOnline) {
      setDeleteDialog({ phase: 'ready', existsRemotely: false, hasPendingChanges: true })
      return
    }
    setDeleteDialog({ phase: 'checking' })
    try {
      const status = await getProjectDeleteStatus(project.id)
      setDeleteDialog({ phase: 'ready', ...status })
    } catch {
      setDeleteDialog({ phase: 'ready', existsRemotely: false, hasPendingChanges: true })
    }
  }

  const confirmDelete = async () => {
    const existsRemotely = deleteDialog.phase === 'ready' && deleteDialog.existsRemotely
    setDeleteDialog({ phase: 'deleting' })
    try {
      await deleteLocalProjectData(project.id, { existsRemotely })
      if (existsRemotely && isOnline) {
        await syncProjectList()
      }
      toast.success('Dados locais removidos')
      setDeleteDialog({ phase: 'idle' })
    } catch {
      toast.error('Erro ao remover dados locais')
      setDeleteDialog({ phase: 'idle' })
    }
  }

  const openSyncDialog = async () => {
    if (!isOnline) {
      toast.error('Sem conexão — conecte-se para sincronizar')
      return
    }
    setSyncDialog({ phase: 'syncing' })
    setIsSyncAble(true)

    const toastId = toast.loading('Sincronizando dados...')
    try {
      await checkForUpdates(project.id)
      await drainQueue()
      const pullResult = await pullUpdates(project.id)
      if (!pullResult.success) throw new Error(pullResult.error)
      const { remoteOnlyItems } = await findSyncConflicts(project.id)
      toast.dismiss(toastId)
      if (remoteOnlyItems.length === 0) {
        await markProjectSynced(project.id)
        toast.success('Dados sincronizados')
        setSyncDialog({ phase: 'idle' })
      } else {
        setSyncDialog({ phase: 'conflicts', items: remoteOnlyItems })
      }
    } catch {
      toast.error('Erro ao sincronizar dados', { id: toastId })
      setSyncDialog({ phase: 'idle' })
    }
    setIsSyncAble(false)
  }

  const resolveConflicts = async (
    resolution: 'keep_local' | 'pull_remote',
    selectedIds?: string[]
  ) => {
    if (syncDialog.phase !== 'conflicts') return
    const items = syncDialog.items
    setSyncDialog({ phase: 'idle' })

    if (resolution === 'pull_remote') {
      const toastId = toast.loading('Baixando itens do servidor...')
      try {
        const result = await pullRemoteItems(
          project.id,
          items.map((i) => i.id)
        )
        if (!result.success) throw new Error(result.error)
        await markProjectSynced(project.id)
        toast.success(`${items.length} item(s) baixado(s)`, { id: toastId })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao baixar itens', { id: toastId })
      }
      return
    }

    // keep_local: baixa os itens selecionados, exclui os demais do servidor
    const selected = new Set(selectedIds ?? [])
    const toKeep = items.filter((i) => selected.has(i.id))
    const toDiscard = items.filter((i) => !selected.has(i.id))

    const toastId = toast.loading('Aplicando resolução de conflitos...')
    try {
      if (toKeep.length > 0) {
        const result = await pullRemoteItems(
          project.id,
          toKeep.map((i) => i.id)
        )
        if (!result.success) throw new Error(result.error)
      }
      for (const item of toDiscard) {
        await enqueueItemDelete(item.id)
      }
      if (toDiscard.length > 0) {
        await drainQueue()
      }
      await markProjectSynced(project.id)
      toast.success(
        `${toKeep.length} item(s) baixado(s), ${toDiscard.length} item(s) excluído(s) do servidor`,
        { id: toastId }
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aplicar resolução', { id: toastId })
    }
  }

  const openPullUpdateAction = async () => {
    if (!isOnline) {
      toast.error('Sem conexão — conecte-se para atualizar')
      return
    }
    const toastId = toast.loading('Baixando atualização...')
    try {
      await drainQueue()
      const result = await pullUpdates(project.id)
      if (!result.success) throw new Error(result.error)
      toast.success('Projeto atualizado', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar', { id: toastId })
    }
  }

  const openDownloadMediaAction = async () => {
    if (!isOnline) {
      toast.error('Sem conexão — conecte-se para baixar mídias')
      return
    }
    const toastId = toast.loading('Baixando mídias para offline...')
    try {
      const result = await downloadProjectMedia(project.id, ({ done, total, failed }) => {
        if (total === 0) return
        toast.loading(`Baixando mídias ${done}/${total}${failed > 0 ? ` (${failed} falha(s))` : ''}...`, {
          id: toastId,
        })
      })
      if (!result.success) throw new Error(result.error)
      toast.success('Mídias disponíveis offline', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao baixar mídias', { id: toastId })
    }
  }

  const closeDeleteDialog = () => setDeleteDialog({ phase: 'idle' })
  const closeSyncDialog = () => setSyncDialog({ phase: 'idle' })

  return {
    deleteDialog,
    syncDialog,
    openDeleteDialog,
    confirmDelete,
    closeDeleteDialog,
    openSyncDialog,
    openPullUpdateAction,
    openDownloadMediaAction,
    resolveConflicts,
    isSyncAble,
    closeSyncDialog,
  }
}
