import { Icon } from '@/components/ui/icon'
import { useStorageMonitor } from '@/shared/hooks/useStorageMonitor'

export function StorageAlmostFullBanner() {
  const { isAlmostFull } = useStorageMonitor()

  if (!isAlmostFull) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <Icon name="database" className="mt-0.5 shrink-0 text-[20px] text-amber-700" />
      <p>Espaço local quase cheio — sincronize para liberar mídias.</p>
    </div>
  )
}
