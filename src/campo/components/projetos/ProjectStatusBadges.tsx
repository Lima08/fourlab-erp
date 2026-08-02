import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import type { DownloadState } from '@/shared/db/dexie'
import type { SyncState } from '@/campo/hooks/useProjectSyncState'

interface Props {
  status: 'pending' | 'in_progress' | 'completed' | 'canceled'
  syncState: SyncState
  pendingCount?: number
  downloadState: DownloadState
  className?: string
}

const STATUS_MAP = {
  pending: { icon: 'radio_button_unchecked', label: 'Não iniciada' },
  in_progress: { icon: 'pending', label: 'Em andamento' },
  completed: { icon: 'task_alt', label: 'Concluída' },
  canceled: { icon: 'cancel', label: 'Cancelado' },
} as const

const SYNC_MAP = {
  synced: {
    icon: 'cloud_done',
    label: 'Sincronizado',
    className: 'bg-emerald-50 text-emerald-700',
  },
  pending: {
    icon: 'cloud_upload',
    label: 'Pendente de envio',
    className: 'bg-red-50 text-red-700',
  },
  update_available: {
    icon: 'cloud_sync',
    label: 'Atualização na nuvem',
    className: 'bg-amber-50 text-amber-700',
  },
} as const

export function ProjectStatusBadges({
  status,
  syncState,
  pendingCount = 0,
  downloadState,
  className,
}: Props) {
  const { icon: locationIcon, label: locationLabel } =
    downloadState === 'device'
      ? { icon: 'tablet_mac', label: 'No dispositivo' }
      : { icon: 'cloud', label: 'Na nuvem' }

  const { icon: statusIcon, label: statusLabel } = STATUS_MAP[status]
  const sync = SYNC_MAP[syncState]
  const syncLabel =
    syncState === 'pending' && pendingCount > 0 ? `Pendente (${pendingCount})` : sync.label

  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      <span className="bg-industrial-100 text-industrial-700 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
        <Icon name={locationIcon} className="text-[14px]" />
        {locationLabel}
      </span>

      <span className="bg-industrial-100 text-industrial-700 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap">
        <Icon name={statusIcon} className="text-[14px]" />
        {statusLabel}
      </span>

      {downloadState === 'device' && (
        <span
          key={syncState}
          className={cn(
            'animate-state-pulse inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-200',
            sync.className
          )}
        >
          <Icon name={sync.icon} className="text-[14px]" />
          {syncLabel}
        </span>
      )}
    </div>
  )
}
