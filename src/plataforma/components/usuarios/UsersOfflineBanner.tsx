import { Icon } from '@/components/ui/icon'

export function UsersOfflineBanner() {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <Icon name="wifi_off" className="mt-0.5 shrink-0 text-[20px] text-amber-700" />
      <p>
        Sem conexão com a internet. A lista não pode ser carregada nem alterada enquanto estiver
        offline.
      </p>
    </div>
  )
}
