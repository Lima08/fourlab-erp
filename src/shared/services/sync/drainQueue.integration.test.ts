import { vi, describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/shared/db/dexie'
import type { Item, Evidence } from '@/shared/db/dexie'
import { drainQueue, resetDrainLockForTests } from '@/shared/services/sync/queueProcessor'
import { supabase } from '@/shared/db/supabase'
import { toast } from 'sonner'

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
      delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
  },
}))

vi.mock('@/shared/stores/authStore', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'user-001' } }) },
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const makeItem = (id: string): Item => ({
  id,
  projectId: 'proj-1',
  locationId: null,
  description: 'Test',
  category: 'other',
  status: 'pending',
  deletedAt: null,
  deletedById: null,
  updatedAt: new Date(),
  technicianId: 'tech-1',
  syncedAt: new Date(),
  conflictStatus: false,
  conflictRemoteStatus: null,
})

const makeEvidence = (
  id: string,
  blob: Blob | null,
  overrides: Partial<Evidence> = {}
): Evidence => ({
  id,
  itemId: 'item-1',
  type: 'photo',
  blob,
  storagePath: null,
  comment: null,
  createdAt: new Date(),
  technicianId: 'tech-1',
  syncedAt: null,
  ...overrides,
})

const addEntry = async (itemId: string, msOffset: number) => {
  await db.syncQueue.add({
    type: 'item_update',
    payload: JSON.stringify({ ...makeItem(itemId), syncedAt: new Date() }),
    attempts: 0,
    createdAt: new Date(Date.now() + msOffset),
  })
}

beforeEach(async () => {
  resetDrainLockForTests()
  await db.delete()
  await db.open()
  vi.clearAllMocks()
  // restore default mock after each test
  vi.mocked(supabase.from).mockImplementation(
    () =>
      ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }) as unknown as ReturnType<typeof supabase.from>
  )
})

describe('drainQueue integration', () => {
  it('FIFO: processa entradas em ordem crescente de createdAt', async () => {
    await addEntry('item-c', 200)
    await addEntry('item-a', 0)
    await addEntry('item-b', 100)

    const callOrder: string[] = []
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          upsert: vi.fn().mockImplementation((data: { id?: string }) => {
            if (data?.id) callOrder.push(data.id)
            return Promise.resolve({ error: null })
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }) as unknown as ReturnType<typeof supabase.from>
    )

    await drainQueue()

    expect(callOrder).toEqual(['item-a', 'item-b', 'item-c'])
  })

  it('sucesso: item_update → entrada removida da syncQueue, item.syncedAt atualizado', async () => {
    const item = makeItem('item-success')
    await db.items.put(item)
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify(item),
      attempts: 0,
      createdAt: new Date(),
    })

    await drainQueue()

    const remaining = await db.syncQueue.toArray()
    expect(remaining).toHaveLength(0)

    const updated = await db.items.get('item-success')
    expect(updated?.syncedAt).not.toBeNull()
  })

  it('falha: erro no upsert → entrada permanece com attempts + 1, sem toast antes do limite', async () => {
    const item = makeItem('item-fail')
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify(item),
      attempts: 0,
      createdAt: new Date(),
    })

    vi.mocked(supabase.from).mockReturnValueOnce({
      upsert: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await drainQueue()

    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry).toBeDefined()
    expect(entry!.attempts).toBe(1)
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled()
  })

  it('falha: attempts >= MAX_RETRIES → descarta entrada e chama toast.error', async () => {
    const item = makeItem('item-fail-max')
    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify(item),
      attempts: 3,
      createdAt: new Date(),
    })

    vi.mocked(supabase.from).mockReturnValueOnce({
      upsert: vi.fn().mockResolvedValue({ error: { message: 'fail' } }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await drainQueue()

    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(0)
    expect(vi.mocked(toast.error)).toHaveBeenCalledOnce()
  })

  it('processa toda a fila em uma chamada (mais de 10 entradas)', async () => {
    for (let i = 0; i < 12; i++) {
      await db.syncQueue.add({
        type: 'item_update',
        payload: JSON.stringify(makeItem(`item-${i}`)),
        attempts: 0,
        createdAt: new Date(Date.now() + i * 10),
      })
    }

    await drainQueue()

    const remaining = await db.syncQueue.toArray()
    expect(remaining).toHaveLength(0)
  })

  it('mutex: chamadas concorrentes processam a fila uma única vez', async () => {
    const item = makeItem('item-mutex')
    await db.items.put(item)

    let resolveUpsert: (() => void) | undefined
    const upsertGate = new Promise<void>((resolve) => {
      resolveUpsert = resolve
    })

    const upsertMock = vi.fn().mockImplementation(async () => {
      await upsertGate
      return { error: null }
    })
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          upsert: upsertMock,
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }) as unknown as ReturnType<typeof supabase.from>
    )

    await db.syncQueue.add({
      type: 'item_update',
      payload: JSON.stringify(item),
      attempts: 0,
      createdAt: new Date(),
    })

    const p1 = drainQueue()
    // Allow drain to enter processEntry and hit the upsert gate
    await Promise.resolve()
    await Promise.resolve()
    const p2 = drainQueue()

    resolveUpsert?.()
    await Promise.all([p1, p2])

    expect(upsertMock).toHaveBeenCalledOnce()
    expect(await db.syncQueue.count()).toBe(0)
  })

  it('evidence_add comentário (blob=null): insert Postgres, storage não chamado, fila removida, syncedAt setado', async () => {
    const ev = makeEvidence('ev-comment', null, {
      type: 'comment',
      comment: 'Observação do técnico',
    })
    await db.evidence.put(ev)
    await db.syncQueue.add({
      type: 'evidence_add',
      payload: JSON.stringify({ evidenceId: 'ev-comment', itemId: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })

    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          upsert: upsertMock,
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }) as unknown as ReturnType<typeof supabase.from>
    )

    await drainQueue()

    expect(vi.mocked(supabase.storage.from)).not.toHaveBeenCalled()
    expect(upsertMock).toHaveBeenCalledOnce()
    const upsertArg = upsertMock.mock.calls[0]?.[0] as { blob_url: string | null }
    expect(upsertArg.blob_url).toBeNull()

    const remaining = await db.syncQueue.toArray()
    expect(remaining).toHaveLength(0)

    const updated = await db.evidence.get('ev-comment')
    expect(updated?.syncedAt).not.toBeNull()
  })

  it('evidence_add foto: upload + upsert no path {projectId}/{itemId}/{evidenceId}', async () => {
    const item = makeItem('item-1')
    await db.items.put(item)
    const blob = { size: 1024, type: 'image/jpeg' } as Blob
    const ev = makeEvidence('ev-photo', blob)
    await db.evidence.put(ev)
    await db.syncQueue.add({
      type: 'evidence_add',
      payload: JSON.stringify({ evidenceId: 'ev-photo', itemId: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })

    const uploadMock = vi.fn().mockResolvedValue({ error: null })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: uploadMock,
      remove: vi.fn().mockResolvedValue({ error: null }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          upsert: upsertMock,
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }) as unknown as ReturnType<typeof supabase.from>
    )

    await drainQueue()

    expect(uploadMock).toHaveBeenCalledWith(
      'proj-1/item-1/ev-photo',
      blob,
      expect.objectContaining({ contentType: 'image/jpeg', upsert: true })
    )
    const upsertArg = upsertMock.mock.calls[0]?.[0] as { blob_url: string }
    expect(upsertArg.blob_url).toBe('proj-1/item-1/ev-photo')

    const remaining = await db.syncQueue.toArray()
    expect(remaining).toHaveLength(0)

    const saved = await db.evidence.get('ev-photo')
    expect(saved?.storagePath).toBe('proj-1/item-1/ev-photo')
    expect(saved?.syncedAt).not.toBeNull()
    expect(saved?.blob).toBeNull()
  })

  it('evidence_add com blob > 10MB: fila permanece, attempts incrementa na 1ª tentativa', async () => {
    const TEN_MB = 10 * 1024 * 1024
    const largeBlob = { size: TEN_MB + 1, type: 'image/jpeg' } as Blob
    const ev = makeEvidence('ev-large', largeBlob)
    const getSpy = vi.spyOn(db.evidence, 'get').mockResolvedValueOnce(ev)

    await db.syncQueue.add({
      type: 'evidence_add',
      payload: JSON.stringify({ evidenceId: 'ev-large', itemId: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })

    await drainQueue()

    getSpy.mockRestore()
    expect(vi.mocked(supabase.storage.from)).not.toHaveBeenCalled()
    const remaining = await db.syncQueue.toArray()
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.attempts).toBe(1)
  })

  it('evidence_add oversize: dead letter na 3ª falha com toast específico', async () => {
    const TEN_MB = 10 * 1024 * 1024
    const largeBlob = { size: TEN_MB + 1, type: 'image/jpeg' } as Blob
    const ev = makeEvidence('ev-dead', largeBlob, { type: 'photo' })
    const getSpy = vi.spyOn(db.evidence, 'get').mockResolvedValue(ev)

    await db.syncQueue.add({
      type: 'evidence_add',
      payload: JSON.stringify({ evidenceId: 'ev-dead', itemId: 'item-1' }),
      attempts: 3,
      createdAt: new Date(),
    })

    await drainQueue()

    getSpy.mockRestore()
    const remaining = await db.syncQueue.toArray()
    expect(remaining).toHaveLength(0)
    const dead = await db.deadLetterQueue.toArray()
    expect(dead).toHaveLength(1)
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Foto excede limite após compressão')
  })

  it('evidence_delete: deleta row remoto e chama storage.remove', async () => {
    const item = makeItem('item-1')
    await db.items.put(item)

    const deleteMock = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
    const removeMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          delete: deleteMock,
          insert: vi.fn().mockResolvedValue({ error: null }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }) as unknown as ReturnType<typeof supabase.from>
    )
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: removeMock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await db.syncQueue.add({
      type: 'evidence_delete',
      payload: JSON.stringify({ evidenceId: 'ev-del', itemId: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })

    await drainQueue()

    expect(deleteMock).toHaveBeenCalledOnce()
    expect(removeMock).toHaveBeenCalledWith(['proj-1/item-1/ev-del'])
    const remaining = await db.syncQueue.toArray()
    expect(remaining).toHaveLength(0)
  })

  it('evidence_delete: erro 404 no storage.remove não falha a operação', async () => {
    const item = makeItem('item-1')
    await db.items.put(item)

    const deleteMock = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }))
    const removeMock = vi.fn().mockResolvedValue({
      error: { message: 'Object not found', statusCode: '404' },
    })
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          delete: deleteMock,
          insert: vi.fn().mockResolvedValue({ error: null }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }) as unknown as ReturnType<typeof supabase.from>
    )
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: removeMock,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await db.syncQueue.add({
      type: 'evidence_delete',
      payload: JSON.stringify({ evidenceId: 'ev-del-404', itemId: 'item-1' }),
      attempts: 0,
      createdAt: new Date(),
    })

    await drainQueue()

    expect(deleteMock).toHaveBeenCalledOnce()
    expect(removeMock).toHaveBeenCalledOnce()
    const remaining = await db.syncQueue.toArray()
    expect(remaining).toHaveLength(0)
  })
})
