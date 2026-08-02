import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import type { ProfileCounts } from '@/shared/services/profileAdminService'

interface Props {
  counts: ProfileCounts | null | undefined
  isOffline?: boolean
  onAddClick: () => void
}

function formatSubtitle(counts: ProfileCounts | null | undefined): string {
  if (!counts) return '—'

  return `${counts.all} membros na equipe · ${counts.ativo} ativos · ${counts.convite_pendente} com convite pendente.`
}

export function UsersPageHeader({ counts, isOffline = false, onAddClick }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-industrial-950 text-3xl font-extrabold tracking-tight md:text-4xl">
          Administração de usuários
        </h1>
        <p className="text-industrial-600 mt-1 text-sm">{formatSubtitle(counts)}</p>
      </div>
      <Button
        type="button"
        disabled={isOffline}
        onClick={onAddClick}
        className="bg-industrial-950 hover:bg-industrial-800 h-11 shrink-0 gap-2 rounded-lg px-5 text-sm font-semibold text-white"
      >
        <Icon name="add" className="text-[18px]" />
        Novo usuário
      </Button>
    </div>
  )
}
