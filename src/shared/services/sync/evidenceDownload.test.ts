import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '@/shared/db/supabase'
import {
  downloadEvidenceBlob,
  hydrateRemoteEvidence,
  hydrateRemoteEvidenceBatch,
} from './evidenceDownload'
import type { Tables } from '@/shared/db/database.types'

vi.mock('@/shared/db/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        download: vi.fn(),
      })),
    },
  },
}))

const makeRemoteEvidence = (overrides: Partial<Tables<'evidence'>> = {}): Tables<'evidence'> => ({
  id: 'ev-1',
  item_id: 'item-1',
  type: 'photo',
  blob_url: 'p1/item-1/ev-1',
  comment: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-01T12:00:00Z',
  technician_id: 'tech-1',
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('hydrateRemoteEvidence', () => {
  it('retorna comentário com blob null sem chamar storage', async () => {
    const remote = makeRemoteEvidence({
      type: 'comment',
      blob_url: null,
      comment: 'Observação',
    })

    const result = await hydrateRemoteEvidence(remote, 'p1')

    expect(result.blob).toBeNull()
    expect(result.comment).toBe('Observação')
    expect(result.type).toBe('comment')
    expect(vi.mocked(supabase.storage.from)).not.toHaveBeenCalled()
  })

  it('baixa blob e seta syncedAt a partir de updated_at remoto', async () => {
    const blob = new Blob(['photo-data'], { type: 'image/jpeg' })
    const download = vi.fn().mockResolvedValue({ data: blob, error: null })
    vi.mocked(supabase.storage.from).mockReturnValue({ download } as never)

    const remote = makeRemoteEvidence({ type: 'photo', blob_url: 'p1/item-1/ev-1' })
    const result = await hydrateRemoteEvidence(remote, 'p1')

    expect(download).toHaveBeenCalledWith('p1/item-1/ev-1')
    expect(result.blob).toBe(blob)
    expect(result.syncedAt).toEqual(new Date('2026-06-01T12:00:00Z'))
  })

  it('em falha de download retorna metadado com blob null e console.warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const download = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
    vi.mocked(supabase.storage.from).mockReturnValue({ download } as never)

    const remote = makeRemoteEvidence({ type: 'video', blob_url: 'p1/item-1/ev-1' })
    const result = await hydrateRemoteEvidence(remote, 'p1')

    expect(result.blob).toBeNull()
    expect(result.storagePath).toBe('p1/item-1/ev-1')
    expect(result.syncedAt).toEqual(new Date('2026-06-01T12:00:00Z'))
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})

describe('hydrateRemoteEvidenceBatch', () => {
  it('hidrata múltiplas evidências em paralelo', async () => {
    const blob = new Blob(['data'], { type: 'image/jpeg' })
    const download = vi.fn().mockResolvedValue({ data: blob, error: null })
    vi.mocked(supabase.storage.from).mockReturnValue({ download } as never)

    const remotes = [
      makeRemoteEvidence({ id: 'ev-1', blob_url: 'p1/item-1/ev-1' }),
      makeRemoteEvidence({ id: 'ev-2', type: 'comment', blob_url: null, comment: 'x' }),
    ]

    const results = await hydrateRemoteEvidenceBatch(remotes, 'p1')

    expect(results).toHaveLength(2)
    expect(results[0]?.blob).toBe(blob)
    expect(results[1]?.blob).toBeNull()
  })
})

describe('downloadEvidenceBlob', () => {
  it('propaga erro quando storage retorna falha', async () => {
    const download = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
    vi.mocked(supabase.storage.from).mockReturnValue({ download } as never)

    await expect(downloadEvidenceBlob('p1/item-1/ev-1')).rejects.toEqual({ message: 'fail' })
  })
})
