import { Icon } from '@/components/ui/icon'

interface Props {
  totalItems: number
  completedItems: number
  progressPct: number
  isActive: boolean
  railOpen: boolean
  onClick: () => void
}

export function AllItemsRailCard({
  totalItems,
  completedItems,
  progressPct,
  isActive,
  railOpen,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex w-full items-center rounded-xl border-2 py-2.5 text-left transition-colors',
        railOpen ? 'gap-3 px-2' : 'justify-center px-0',
        isActive
          ? 'border-industrial-950 bg-industrial-950 text-white'
          : 'text-industrial-700 hover:bg-industrial-100 border-transparent bg-white',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          isActive ? 'bg-white/10' : 'bg-industrial-100',
        ].join(' ')}
      >
        <Icon
          name="apps"
          className={['text-[20px]', isActive ? 'text-white' : 'text-industrial-500'].join(' ')}
        />
      </div>

      <div
        className={[
          'min-w-0 transition-opacity duration-150',
          railOpen ? 'flex-1 opacity-100' : 'pointer-events-none w-0 overflow-hidden opacity-0',
        ].join(' ')}
      >
        <p className="truncate text-[13px] font-extrabold whitespace-nowrap">Todos os itens</p>
        <p
          className={[
            'mt-0.5 text-[12px] font-bold tabular-nums',
            isActive ? 'text-white/80' : 'text-industrial-400',
          ].join(' ')}
        >
          {completedItems}/{totalItems}
        </p>
        <div
          className={[
            'mt-1.5 h-1 w-full overflow-hidden rounded-full',
            isActive ? 'bg-white/20' : 'bg-industrial-100',
          ].join(' ')}
        >
          <div
            className={[
              'h-full rounded-full transition-[width] duration-500 ease-in-out',
              isActive ? 'bg-white' : 'bg-safety-blue',
            ].join(' ')}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </button>
  )
}
