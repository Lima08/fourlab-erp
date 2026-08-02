import { Icon } from '@/components/ui/icon'

interface CustomerEmptyStateProps {
  hasSearch: boolean
}

export function CustomerEmptyState({ hasSearch }: CustomerEmptyStateProps) {
  return (
    <div className="border-industrial-200 flex flex-col items-center gap-3 rounded-xl border bg-white px-6 py-16 text-center">
      <span className="bg-industrial-100 text-industrial-500 flex size-14 items-center justify-center rounded-full">
        <Icon name="groups" className="text-[28px]" />
      </span>
      <div className="space-y-1">
        <p className="text-industrial-900 text-lg font-bold">
          {hasSearch ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
        </p>
        <p className="text-industrial-500 text-sm">
          {hasSearch
            ? 'Tente outro termo de busca ou altere o filtro de status.'
            : 'Cadastre o primeiro cliente para começar.'}
        </p>
      </div>
    </div>
  )
}
