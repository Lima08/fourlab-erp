import type { CountByStatus } from '@/shared/db/dexie'
import { DashboardCard, type DashboardCardType } from './DashboardCard'

const CARD_TYPES: DashboardCardType[] = [
  'all',
  'pending',
  'in_progress',
  'completed',
  'device',
  'cloud',
]

interface Props {
  counts: CountByStatus | undefined
}

export function DashboardCardList({ counts }: Props) {
  if (!counts) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CARD_TYPES.map((type) => (
          <div
            key={type}
            className="border-industrial-200 h-49 animate-pulse rounded-xl border bg-white p-6"
          >
            <div className="bg-industrial-200 size-11 rounded-lg" />
            <div className="bg-industrial-200 mt-6 h-8 w-16 rounded" />
            <div className="bg-industrial-100 mt-3 h-4 w-24 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {CARD_TYPES.map((type) => (
        <DashboardCard key={type} cardType={type} count={counts[type]} />
      ))}
    </div>
  )
}
