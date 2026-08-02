import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import type { Project } from '@/shared/db/dexie'
import type { SyncState } from '@/campo/hooks/useProjectSyncState'

interface Props {
  project: Project
  isOnline: boolean
  syncState: SyncState
  isSyncAble: boolean
  onContinue: () => void
  onDownload: () => void
  onUpdate: () => void
}

/** Ação principal do card (full-width). Opções secundárias ficam no menu do header. */
export function ProjectCardActions({
  project,
  isOnline,
  syncState,
  isSyncAble,
  onContinue,
  onDownload,
  onUpdate,
}: Props) {
  const { downloadState, status } = project

  if (downloadState === 'cloud') {
    return (
      <Button
        size="touch-lg"
        disabled={!isOnline}
        onClick={onDownload}
        className="border-industrial-300 bg-industrial-100 text-industrial-900 hover:bg-industrial-200 w-full border"
      >
        <Icon name="cloud_download" className="text-[20px]" />
        Baixar projeto
      </Button>
    )
  }

  if (syncState === 'update_available' && isOnline) {
    return (
      <Button
        size="touch-lg"
        onClick={onUpdate}
        disabled={isSyncAble}
        className="border-industrial-300 text-industrial-900 hover:bg-industrial-50 w-full border-2 bg-white"
      >
        <Icon name="sync" className="text-[20px]" />
        Atualizar
      </Button>
    )
  }

  if (syncState === 'update_available' && !isOnline) {
    return (
      <Button
        size="touch-lg"
        disabled
        className="border-industrial-300 bg-industrial-100 text-industrial-500 w-full border-2"
      >
        <Icon name="cloud_off" className="text-[20px]" />
        Offline — atualização pendente
      </Button>
    )
  }

  return (
    <Button
      size="touch-lg"
      onClick={onContinue}
      className="bg-industrial-900 hover:bg-industrial-800 w-full text-white"
    >
      <Icon name="play_arrow" className="text-[20px]" />
      {status === 'pending' ? 'Iniciar vistoria' : 'Continuar vistoria'}
    </Button>
  )
}
