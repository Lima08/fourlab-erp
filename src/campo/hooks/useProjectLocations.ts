import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/dexie'
import type { Item, Location } from '@/shared/db/dexie'

const LOCATION_ICONS: Record<Location['type'], string> = {
  floor: 'floor',
  building: 'apartment',
  room: 'meeting_room',
  outdoor: 'outdoor_grill',
  other: 'place',
}

function getLocationIcon(location: Location): string {
  if (/cobert/i.test(location.name)) return 'roofing'
  return LOCATION_ICONS[location.type] ?? 'place'
}

export interface LocationWithStats {
  location: Location
  completedLocal: number
  totalLocal: number
  irregularCount: number
  isComplete: boolean
  icon: string
}

export function useProjectLocations(
  projectId: string,
  externalItems?: Item[]
): LocationWithStats[] | undefined {
  return useLiveQuery(async () => {
    const locations = await db.locations.where('projectId').equals(projectId).sortBy('name')

    const items =
      externalItems ??
      (await db.items
        .where('projectId')
        .equals(projectId)
        .filter((i) => i.deletedAt === null)
        .toArray())

    const itemsByLocation = new Map<
      string,
      { completed: number; total: number; irregular: number }
    >()
    for (const item of items) {
      const locId = item.locationId ?? '__none__'
      const entry = itemsByLocation.get(locId) ?? { completed: 0, total: 0, irregular: 0 }
      entry.total++
      if (item.status !== 'pending') entry.completed++
      if (item.status === 'irregular') entry.irregular++
      itemsByLocation.set(locId, entry)
    }

    return locations.map((location) => {
      const stats = itemsByLocation.get(location.id) ?? { completed: 0, total: 0, irregular: 0 }
      return {
        location,
        completedLocal: stats.completed,
        totalLocal: stats.total,
        irregularCount: stats.irregular,
        isComplete: stats.total > 0 && stats.completed === stats.total,
        icon: getLocationIcon(location),
      }
    })
  }, [projectId, externalItems])
}
