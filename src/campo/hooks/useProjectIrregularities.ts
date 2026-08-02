import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/dexie'
import type { Item } from '@/shared/db/dexie'

export interface IrregularItemWithEvidence {
  item: Item
  locationName: string | null
  photoUrl: string | null
  comment: string | null
}

export function useProjectIrregularities(
  projectId: string
): IrregularItemWithEvidence[] | undefined {
  const objectUrlsRef = useRef<string[]>([])

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        URL.revokeObjectURL(url)
      }
      objectUrlsRef.current = []
    }
  }, [])

  return useLiveQuery(async () => {
    for (const url of objectUrlsRef.current) {
      URL.revokeObjectURL(url)
    }
    objectUrlsRef.current = []

    const [irregularItems, locations] = await Promise.all([
      db.items
        .where('projectId')
        .equals(projectId)
        .filter((i) => i.status === 'irregular' && i.deletedAt === null)
        .toArray(),
      db.locations.where('projectId').equals(projectId).toArray(),
    ])

    if (irregularItems.length === 0) return []

    const locationMap = new Map(locations.map((l) => [l.id, l.name]))
    const itemIds = irregularItems.map((i) => i.id)
    const allEvidences = await db.evidence.where('itemId').anyOf(itemIds).toArray()

    const evidenceByItem = new Map<string, { photoUrl: string | null; comment: string | null }>()
    for (const ev of allEvidences) {
      const existing = evidenceByItem.get(ev.itemId)
      if (ev.type === 'photo' && ev.blob !== null && !existing?.photoUrl) {
        const url = URL.createObjectURL(ev.blob)
        objectUrlsRef.current.push(url)
        evidenceByItem.set(ev.itemId, { photoUrl: url, comment: existing?.comment ?? null })
      } else if (ev.type === 'comment' && ev.comment !== null) {
        const prev = evidenceByItem.get(ev.itemId)
        evidenceByItem.set(ev.itemId, { photoUrl: prev?.photoUrl ?? null, comment: ev.comment })
      }
    }

    return irregularItems.map((item) => {
      const ev = evidenceByItem.get(item.id)
      return {
        item,
        locationName: item.locationId !== null ? (locationMap.get(item.locationId) ?? null) : null,
        photoUrl: ev?.photoUrl ?? null,
        comment: ev?.comment ?? null,
      }
    })
  }, [projectId])
}
