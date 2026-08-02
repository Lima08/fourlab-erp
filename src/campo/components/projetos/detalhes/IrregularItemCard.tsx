import { Icon } from '@/components/ui/icon'
import type { IrregularItemWithEvidence } from '@/campo/hooks/useProjectIrregularities'
import type { ItemCategory } from '@/shared/db/dexie'

const CATEGORY_ICONS: Record<ItemCategory, string> = {
  extinguisher: 'fire_extinguisher',
  emergency_exit: 'emergency',
  lighting: 'wb_twilight',
  sprinkler: 'water_drop',
  alarm: 'notifications_active',
  other: 'report_problem',
}

interface Props {
  data: IrregularItemWithEvidence
}

export function IrregularItemCard({ data }: Props) {
  const { item, locationName, photoUrl, comment } = data
  const categoryIcon = CATEGORY_ICONS[item.category] ?? 'report_problem'

  return (
    <article className="border-industrial-200 flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="bg-industrial-100 text-industrial-500 flex size-12 flex-shrink-0 items-center justify-center rounded-lg">
            <Icon name={categoryIcon} className="text-[22px]" />
          </div>
          <div>
            <h4 className="text-industrial-900 text-sm font-medium">{item.description}</h4>
            {locationName && (
              <p className="text-industrial-500 mt-0.5 flex items-center gap-1 text-xs">
                <Icon name="location_on" className="text-[14px]" />
                {locationName}
              </p>
            )}
          </div>
        </div>
        <span className="flex-shrink-0 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
          Irregular
        </span>
      </div>

      <div className="border-industrial-100 bg-industrial-50 flex items-center gap-3 rounded-lg border p-3">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Evidência fotográfica"
            className="size-10 flex-shrink-0 rounded object-cover"
          />
        ) : (
          <div className="bg-industrial-200 text-industrial-400 flex size-10 flex-shrink-0 items-center justify-center rounded">
            <Icon name="image" className="text-[20px]" />
          </div>
        )}
        {comment && <p className="text-industrial-500 text-sm">{comment}</p>}
        {!comment && !photoUrl && (
          <p className="text-industrial-400 text-sm">Sem evidência registrada</p>
        )}
      </div>
    </article>
  )
}
