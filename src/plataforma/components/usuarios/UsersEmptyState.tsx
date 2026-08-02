import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

interface Props {
  onClearFilters: () => void
}

export function UsersEmptyState({ onClearFilters }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Icon name="search_off" className="text-industrial-300 text-[48px]" />
      <div>
        <p className="text-industrial-700 text-lg font-semibold">Nenhum usuário encontrado</p>
        <p className="text-industrial-500 mt-1 text-sm">
          Ajuste a busca ou os filtros para ver mais usuários.
        </p>
      </div>
      <Button type="button" variant="outline" onClick={onClearFilters} className="font-semibold">
        Limpar filtros
      </Button>
    </div>
  )
}
