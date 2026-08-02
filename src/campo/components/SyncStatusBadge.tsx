import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/dexie'
import { Badge } from '@/components/ui/badge'
import { useConnectivity } from '@/shared/hooks/useConnectivity'

export default function SyncStatusBadge() {
  const { isOnline } = useConnectivity()
  const queueCount = useLiveQuery(() => db.syncQueue.count(), []) ?? 0

  if (!isOnline) {
    return (
      <Badge variant="destructive" className="gap-1">
        <span className="size-2 rounded-full bg-red-200" />
        Offline — dados salvos localmente
      </Badge>
    )
  }

  if (queueCount > 0) {
    return (
      <Badge variant="outline" className="gap-1 border-yellow-400 bg-yellow-50 text-yellow-800">
        <span className="size-2 rounded-full bg-yellow-400" />
        {queueCount} {queueCount === 1 ? 'item' : 'itens'} na fila de sync
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 border-green-400 bg-green-50 text-green-800">
      <span className="size-2 rounded-full bg-green-400" />
      Online — dados salvos
    </Badge>
  )
}
