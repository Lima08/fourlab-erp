import { Link } from 'react-router-dom'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'
import type { CountByStatus } from '@/shared/db/dexie'

export type DashboardCardType = Extract<
  keyof CountByStatus,
  'all' | 'pending' | 'in_progress' | 'completed' | 'device' | 'cloud'
>

const iconVariants = cva('flex size-11 items-center justify-center rounded-lg text-[22px]', {
  variants: {
    cardType: {
      all: 'bg-industrial-100 text-industrial-700',
      pending: 'bg-status-pending-bg text-status-pending-text',
      in_progress: 'bg-status-progress-bg text-status-progress-text',
      completed: 'bg-status-updated-bg text-status-updated-text',
      device: 'bg-status-device-bg text-status-device-text',
      cloud: 'bg-status-cloud-bg text-status-cloud-text',
    },
  },
})

const CARD_CONFIG: Record<
  DashboardCardType,
  { icon: string; label: string; description: string; to: string }
> = {
  all: {
    icon: 'apps',
    label: 'Todos',
    description: 'Projetos cadastrados no sistema',
    to: '/campo',
  },
  pending: {
    icon: 'radio_button_unchecked',
    label: 'Pendente',
    description: 'Vistorias não iniciadas',
    to: '/campo?status=pending',
  },
  in_progress: {
    icon: 'schedule',
    label: 'Em andamento',
    description: 'Vistorias em execução',
    to: '/campo?status=in_progress',
  },
  completed: {
    icon: 'task_alt',
    label: 'Concluído',
    description: 'Vistorias finalizadas',
    to: '/campo?status=completed',
  },
  device: {
    icon: 'tablet_mac',
    label: 'No dispositivo',
    description: 'Projetos baixados no tablet',
    to: '/campo?downloadState=device',
  },
  cloud: {
    icon: 'cloud',
    label: 'Na nuvem',
    description: 'Projetos disponíveis para download',
    to: '/campo?downloadState=cloud',
  },
}

interface Props {
  cardType: DashboardCardType
  count: number
}

export function DashboardCard({ cardType, count }: Props) {
  const { icon, label, description, to } = CARD_CONFIG[cardType]

  return (
    <article className="border-industrial-200 relative flex h-full flex-col overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-start justify-between">
          <span className={cn(iconVariants({ cardType }))}>
            <Icon name={icon} />
          </span>
        </div>

        <p className="text-industrial-950 text-3xl font-extrabold">{count}</p>
        <p className="text-industrial-900 mt-1 text-sm font-semibold">{label}</p>
        <p className="text-industrial-500 text-sm">{description}</p>

        <div className="border-industrial-200 mt-4 border-t pt-4">
          <Link
            to={to}
            className="text-safety-blue inline-flex items-center gap-1 text-sm font-semibold"
          >
            Abrir projetos filtrados
            <Icon name="chevron_right" className="text-[18px]" />
          </Link>
        </div>
      </div>
    </article>
  )
}
