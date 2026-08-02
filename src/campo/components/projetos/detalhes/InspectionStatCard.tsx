import { cn } from '@/lib/utils'
import { Icon } from '@/components/ui/icon'

interface Props {
  label: string
  value: string | number
  icon: string
  tone: string
  active?: boolean
  onClick: () => void
}

export function InspectionStatCard({ label, value, icon, tone, active = false, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'bg-industrial-50 flex min-w-0 flex-col items-start rounded-xl border-2 px-3 py-2.5 text-left transition-colors duration-150 md:px-4 md:py-3',
        'hover:border-industrial-300 active:scale-98',
        active ? 'border-industrial-900' : 'border-transparent'
      )}
    >
      <span className="text-industrial-400 mb-1 flex items-center gap-1.5 text-[11px] leading-tight font-bold tracking-wide uppercase">
        <Icon name={icon} className="shrink-0 text-[16px]" />
        <span className="wrap-break-word">{label}</span>
      </span>
      <span className={cn('text-2xl leading-none font-extrabold tabular-nums', tone)}>{value}</span>
    </button>
  )
}
