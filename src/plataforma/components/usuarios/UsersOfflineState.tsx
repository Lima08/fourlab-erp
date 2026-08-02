import { Icon } from '@/components/ui/icon'

export function UsersOfflineState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Icon name="cloud_off" className="text-industrial-300 text-[48px]" />
      <div>
        <p className="text-industrial-700 text-lg font-semibold">Lista indisponível offline</p>
        <p className="text-industrial-500 mt-1 text-sm">
          Reconecte-se à internet para visualizar e gerenciar usuários.
        </p>
      </div>
    </div>
  )
}
