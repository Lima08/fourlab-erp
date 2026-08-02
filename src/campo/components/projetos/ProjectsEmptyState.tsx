import { Icon } from '@/components/ui/icon'

interface Props {
  isOnline: boolean
}

export function ProjectsEmptyState({ isOnline }: Props) {
  return (
    <div className="text-industrial-500 flex flex-col items-center gap-4 py-16 text-center">
      <Icon name="folder_off" className="text-industrial-300 text-[48px]" />
      <p className="text-industrial-700 text-lg font-semibold">Nenhum projeto disponível</p>
      {isOnline && (
        <p className="text-industrial-500 text-sm">
          Entre em contato com o gestor para receber projetos ou os adicione através do dashboard
        </p>
      )}
    </div>
  )
}
