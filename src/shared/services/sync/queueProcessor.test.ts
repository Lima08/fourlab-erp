import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/shared/db/dexie'
import type { Evidence, Item, Location } from '@/shared/db/dexie'
import {
  buildErrorReason,
  discardQueueEntry,
  enqueueItemUpdate,
  enqueueItemAdd,
  enqueueItemDelete,
  enqueueEvidenceAdd,
  enqueueEvidenceDelete,
  enqueueLocationAdd,
  enqueueLocationUpdate,
  enqueueLocationDelete,
  enqueueProjectUpdate,
} from './queueProcessor'

const makeItem = (): Item => ({
  id: 'item-001',
  projectId: 'proj-001',
  locationId: null,
  description: 'Test',
  category: 'other',
  status: 'pending',
  deletedAt: null,
  deletedById: null,
  updatedAt: new Date(),
  technicianId: 'tech-1',
  syncedAt: null,
  conflictStatus: false,
  conflictRemoteStatus: null,
})

const makeEvidence = (): Evidence => ({
  id: 'ev-001',
  itemId: 'item-001',
  type: 'photo',
  blob: null,
  storagePath: null,
  comment: null,
  createdAt: new Date(),
  technicianId: 'tech-1',
  syncedAt: null,
})

const makeLocation = (): Location => ({
  id: 'loc-001',
  projectId: 'proj-001',
  name: 'Sala 1',
  type: 'room',
  deletedAt: null,
  updatedAt: new Date(),
})

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('enqueue functions', () => {
  it('enqueueItemUpdate: tipo=item_update, count=1, payload.id coincide', async () => {
    const item = makeItem()
    await enqueueItemUpdate(item)
    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry?.type).toBe('item_update')
    expect(JSON.parse(entry!.payload).id).toBe(item.id)
  })

  it('enqueueItemAdd: tipo=item_add, count=1, payload.id coincide', async () => {
    const item = makeItem()
    await enqueueItemAdd(item)
    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry?.type).toBe('item_add')
    expect(JSON.parse(entry!.payload).id).toBe(item.id)
  })

  it('enqueueItemDelete: tipo=item_delete, payload.itemId coincide', async () => {
    await enqueueItemDelete('item-001')
    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry?.type).toBe('item_delete')
    expect(JSON.parse(entry!.payload).itemId).toBe('item-001')
  })

  it('enqueueEvidenceAdd: tipo=evidence_add, payload tem evidenceId e itemId', async () => {
    const evidence = makeEvidence()
    await enqueueEvidenceAdd(evidence)
    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry?.type).toBe('evidence_add')
    const payload = JSON.parse(entry!.payload)
    expect(payload.evidenceId).toBe(evidence.id)
    expect(payload.itemId).toBe(evidence.itemId)
  })

  it('enqueueEvidenceDelete: tipo=evidence_delete, payload tem evidenceId e itemId', async () => {
    await enqueueEvidenceDelete('ev-001', 'item-001')
    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry?.type).toBe('evidence_delete')
    const payload = JSON.parse(entry!.payload)
    expect(payload.evidenceId).toBe('ev-001')
    expect(payload.itemId).toBe('item-001')
  })

  it('enqueueLocationAdd: tipo=location_add, payload tem location completa', async () => {
    const location = makeLocation()
    await enqueueLocationAdd(location)
    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry?.type).toBe('location_add')
    const payload = JSON.parse(entry!.payload)
    expect(payload.id).toBe(location.id)
    expect(payload.name).toBe(location.name)
    expect(payload.type).toBe(location.type)
  })

  it('enqueueLocationUpdate: type=location_update', async () => {
    const location = makeLocation()
    await enqueueLocationUpdate(location)
    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0]?.type).toBe('location_update')
  })

  it('enqueueLocationDelete: tipo=location_delete, payload.locationId coincide', async () => {
    await enqueueLocationDelete('loc-001')
    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry?.type).toBe('location_delete')
    expect(JSON.parse(entry!.payload).locationId).toBe('loc-001')
  })

  it('enqueueProjectUpdate: tipo=project_update, payload tem projectId e status', async () => {
    await enqueueProjectUpdate('proj-001', 'in_progress')
    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry?.type).toBe('project_update')
    expect(JSON.parse(entry!.payload)).toEqual({
      projectId: 'proj-001',
      status: 'in_progress',
    })
  })
})

describe('buildErrorReason', () => {
  it('objeto com code e message → "code: message"', () => {
    expect(buildErrorReason({ message: 'foo', code: 'P0001' })).toBe('P0001: foo')
  })

  it('primitivo string → "Erro desconhecido"', () => {
    expect(buildErrorReason('string primitivo')).toBe('Erro desconhecido')
  })
})

describe('discardQueueEntry', () => {
  it('entrada existente: removida da syncQueue, adicionada à deadLetterQueue com campos corretos', async () => {
    const entryId = await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify({ id: 'item-001' }),
      attempts: 0,
      createdAt: new Date(),
    })
    expect(entryId).toBeDefined()

    await discardQueueEntry(entryId!, 'max retries exceeded')

    const remaining = await db.syncQueue.toArray()
    expect(remaining).toHaveLength(0)

    const dead = await db.deadLetterQueue.toArray()
    expect(dead).toHaveLength(1)
    const deadEntry = dead[0]
    expect(deadEntry?.failureReason).toBe('max retries exceeded')
    expect(deadEntry?.originalEntryId).toBe(entryId)
    expect(deadEntry?.type).toBe('item_update')
  })

  it('entrada inexistente (id=9999): não escreve, não lança erro', async () => {
    await expect(discardQueueEntry(9999, 'reason')).resolves.toBeUndefined()
    const dead = await db.deadLetterQueue.toArray()
    expect(dead).toHaveLength(0)
  })
})
