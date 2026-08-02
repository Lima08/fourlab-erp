import { Menu } from '@base-ui/react/menu'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import type { DownloadState } from '@/shared/db/dexie'
import type { SyncState } from '@/campo/hooks/useProjectSyncState'

interface Props {
  downloadState: DownloadState
  syncState: SyncState
  isOnline: boolean
  onSyncAction: () => void
  onPullUpdate: () => void
  onDownloadMedia: () => void
  onDeleteLocal: () => void
  onDownload: () => void
  triggerClassName?: string
}

const itemClass = cn(
  'flex w-full cursor-pointer items-center gap-2 px-3 py-2 outline-none',
  'hover:bg-industrial-50 focus:bg-industrial-50',
  'disabled:cursor-not-allowed disabled:opacity-50'
)

const defaultTriggerClassName =
  'flex h-14 w-14 items-center justify-center rounded-md border-2 border-industrial-300 bg-white text-industrial-900 hover:bg-industrial-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-400'

export function ProjectOptionsMenu({
  downloadState,
  syncState,
  isOnline,
  onSyncAction,
  onPullUpdate,
  onDownloadMedia,
  onDeleteLocal,
  triggerClassName,
}: Props) {
  const syncItem =
    downloadState === 'device'
      ? syncState === 'pending'
        ? { icon: 'cloud_upload', label: 'Enviar alterações para a nuvem', handler: onSyncAction }
        : syncState === 'update_available'
          ? { icon: 'cloud_sync', label: 'Baixar atualização da nuvem', handler: onPullUpdate }
          : { icon: 'cloud_done', label: 'Verificar sincronização', handler: onSyncAction }
      : null

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          'flex items-center justify-center',
          triggerClassName ?? defaultTriggerClassName
        )}
        aria-label="Mais opções"
      >
        <Icon name="more_vert" className="text-[20px]" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4}>
          <Menu.Popup className="bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 min-w-55 overflow-hidden rounded-lg py-1 text-sm shadow-md ring-1">
            <>
              {syncItem && (
                <Menu.Item disabled={!isOnline} onClick={syncItem.handler} className={itemClass}>
                  <Icon name={syncItem.icon} className="text-industrial-600 text-[18px]" />
                  {syncItem.label}
                  {!isOnline && (
                    <span className="text-industrial-400 ml-auto text-[12px] font-bold">
                      offline
                    </span>
                  )}
                </Menu.Item>
              )}
              {downloadState === 'device' && (
                <Menu.Item disabled={!isOnline} onClick={onDownloadMedia} className={itemClass}>
                  <Icon name="download" className="text-industrial-600 text-[18px]" />
                  Baixar mídias para offline
                  {!isOnline && (
                    <span className="text-industrial-400 ml-auto text-[12px] font-bold">
                      offline
                    </span>
                  )}
                </Menu.Item>
              )}
              <Menu.Item
                onClick={onDeleteLocal}
                className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 flex w-full cursor-pointer items-center gap-2 px-3 py-2 outline-none"
              >
                <Icon name="delete" className="text-[18px]" />
                Remover do dispositivo
              </Menu.Item>
            </>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
