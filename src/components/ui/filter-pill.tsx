import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

interface FilterPillProps<T extends string> {
  id: T
  label: string
  icon: string
  count: number
  active: boolean
  onClick: (id: T) => void
}

export function FilterPill<T extends string>({
  id,
  label,
  icon,
  count,
  active,
  onClick,
}: FilterPillProps<T>) {
  return (
    <button
      onClick={() => onClick(id)}
      aria-pressed={active}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border-2 py-1.5 pr-3.5 pl-3 text-sm font-bold transition active:scale-95',
        active
          ? 'border-industrial-950 bg-industrial-950 text-white'
          : 'border-industrial-200 text-industrial-600 hover:border-industrial-400 bg-white'
      )}
    >
      <Icon name={icon} fill={active} className="text-[18px]" />
      {label}
      <span
        className={cn(
          'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-extrabold',
          active ? 'bg-white/20 text-white' : 'bg-industrial-100 text-industrial-500'
        )}
      >
        {count}
      </span>
    </button>
  )
}
