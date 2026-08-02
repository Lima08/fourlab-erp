import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { IrregularItemCard } from './IrregularItemCard'
import type { IrregularItemWithEvidence } from '@/campo/hooks/useProjectIrregularities'

interface Props {
  items: IrregularItemWithEvidence[] | undefined
}

export function IrregularitiesSection({ items }: Props) {
  const [isOpen, setIsOpen] = useState(true)

  if (items !== undefined && items.length === 0) return null

  const count = items?.length ?? 0

  return (
    <section>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="mb-4 flex w-full items-center justify-between"
        aria-expanded={isOpen}
      >
        <h3 className="text-industrial-900 flex items-center gap-2 text-lg font-semibold">
          <Icon name="report_problem" className="text-safety-amber text-[22px]" />
          Irregularidades
          {count > 0 && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
              {count}
            </span>
          )}
        </h3>
        <Icon
          name="expand_more"
          className={`text-industrial-400 text-[22px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="space-y-4">
          {items === undefined ? (
            <div className="bg-industrial-100 h-24 animate-pulse rounded-xl" />
          ) : (
            items.map((data) => <IrregularItemCard key={data.item.id} data={data} />)
          )}
        </div>
      )}
    </section>
  )
}
