import { CircularProgress } from '@/components/ui/circular-progress'
import { Icon } from '@/components/ui/icon'
import { InspectionStatCard } from './InspectionStatCard'
import type { InspectionStatusFilter } from '@/campo/utils/inspectionStats'

interface Props {
  progressPct: number
  completedCount: number
  totalCount: number
  regularCount: number
  pendingCount: number
  irregularCount: number
  absentCount: number
  activeFilter: InspectionStatusFilter
  onFilterChange: (filter: InspectionStatusFilter) => void
}

export function ProjectInspectionStatus({
  progressPct,
  completedCount,
  totalCount,
  regularCount,
  pendingCount,
  irregularCount,
  absentCount,
  activeFilter,
  onFilterChange,
}: Props) {
  return (
    <section className="border-industrial-200 overflow-hidden rounded-2xl border-2 bg-white">
      <div className="flex items-center justify-between gap-3 px-5 py-4 md:px-6">
        <h3 className="text-industrial-500 flex items-center gap-2 text-[15px] font-extrabold tracking-wide uppercase">
          <Icon name="task_alt" className="text-industrial-400 text-[19px]" />
          Status da vistoria
        </h3>
      </div>

      <div className="flex flex-col items-center gap-6 px-5 pt-1 pb-6 sm:flex-row md:px-6">
        <CircularProgress value={progressPct} size={104} strokeWidth={9} label="Vistoriado" />

        <div className="grid w-full flex-1 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:gap-4 lg:grid-cols-5">
          <InspectionStatCard
            label="Itens"
            value={`${completedCount}/${totalCount}`}
            icon="inventory"
            tone="text-industrial-900"
            active={activeFilter === 'all'}
            onClick={() => onFilterChange('all')}
          />
          <InspectionStatCard
            label="Conformes"
            value={regularCount}
            icon="check_circle"
            tone="text-safety-green"
            active={activeFilter === 'regular'}
            onClick={() => onFilterChange('regular')}
          />
          <InspectionStatCard
            label="Pendentes"
            value={pendingCount}
            icon="pending"
            tone="text-safety-amber"
            active={activeFilter === 'pending'}
            onClick={() => onFilterChange('pending')}
          />
          <InspectionStatCard
            label="Irregulares"
            value={irregularCount}
            icon="report_problem"
            tone="text-red-600"
            active={activeFilter === 'irregular'}
            onClick={() => onFilterChange('irregular')}
          />
          <InspectionStatCard
            label="Ausentes"
            value={absentCount}
            icon="search_off"
            tone="text-red-600"
            active={activeFilter === 'absent'}
            onClick={() => onFilterChange('absent')}
          />
        </div>
      </div>
    </section>
  )
}
