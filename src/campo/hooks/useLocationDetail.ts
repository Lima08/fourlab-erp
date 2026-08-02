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

export interface LocationDetailResult {
  location: Location | undefined
  locationIcon: string
  items: {
    pending: Item[]
    irregular: Item[]
    regular: Item[]
    absent: Item[]
  }
  totalLocal: number
  completedLocal: number
  progressPct: number
  isComplete: boolean
  isLoading: boolean
}

export function useLocationDetail(locationId: string): LocationDetailResult {
  const result = useLiveQuery(async () => {
    const location = await db.locations.get(locationId)
    const allItems = await db.items
      .where('locationId')
      .equals(locationId)
      .filter((i) => i.deletedAt === null)
      .toArray()

    const pending = allItems.filter((i) => i.status === 'pending')
    const irregular = allItems.filter((i) => i.status === 'irregular')
    const regular = allItems.filter((i) => i.status === 'regular')
    const absent = allItems.filter((i) => i.status === 'absent')

    const totalLocal = allItems.length
    const completedLocal = allItems.filter((i) => i.status !== 'pending').length
    const progressPct = totalLocal === 0 ? 0 : Math.round((completedLocal / totalLocal) * 100)
    const isComplete = totalLocal > 0 && completedLocal === totalLocal

    return {
      location,
      locationIcon: location ? getLocationIcon(location) : 'place',
      items: { pending, irregular, regular, absent },
      totalLocal,
      completedLocal,
      progressPct,
      isComplete,
    }
  }, [locationId])

  if (result === undefined) {
    return {
      location: undefined,
      locationIcon: 'place',
      items: { pending: [], irregular: [], regular: [], absent: [] },
      totalLocal: 0,
      completedLocal: 0,
      progressPct: 0,
      isComplete: false,
      isLoading: true,
    }
  }

  return { ...result, isLoading: false }
}
