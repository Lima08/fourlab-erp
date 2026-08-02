import { cn } from '@/lib/utils'
import { useConnectivity } from '@/shared/hooks/useConnectivity'

export function ConnectivityBadge() {
  const { isOnline } = useConnectivity()

  return (
    <span
      key={isOnline ? 'online' : 'offline'}
      className={cn(
        'animate-state-pulse inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200',
        isOnline
          ? 'border-green-600/30 bg-green-50 text-green-800'
          : 'border-industrial-200 bg-industrial-50 text-industrial-600'
      )}
    >
      {isOnline ? (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-green-600" />
        </span>
      ) : (
        <span className="bg-industrial-400 size-2 rounded-full" />
      )}
      <span className="sr-only md:not-sr-only">{isOnline ? 'Online' : 'Offline'}</span>
    </span>
  )
}
