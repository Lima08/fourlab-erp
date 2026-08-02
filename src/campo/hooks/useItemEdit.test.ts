import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { db } from '@/shared/db/dexie'
import { enqueueEvidenceDelete, enqueueItemUpdate } from '@/shared/services/sync/queueProcessor'
import { compressImage } from '@/campo/hooks/imageCompression'
import { compressVideo } from '@/campo/hooks/videoCompression'
import { validateVideoDuration } from '@/campo/hooks/videoValidation'
import { PHOTO_MAX_BYTES, VIDEO_MAX_DURATION_SEC } from '@/shared/constants/evidenceLimits'
import { useItemEdit } from './useItemEdit'

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

vi.mock('@/shared/services/sync/queueProcessor', () => ({
  enqueueEvidenceAdd: vi.fn(),
  enqueueEvidenceDelete: vi.fn(),
  enqueueItemUpdate: vi.fn(),
  enqueueItemAdd: vi.fn(),
}))

vi.mock('@/campo/utils/inspectionStats', () => ({
  recomputeProjectProgress: vi.fn(),
}))

vi.mock('@/shared/stores/authStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'tech-1' } }),
}))

vi.mock('@/campo/hooks/imageCompression', () => ({
  compressImage: vi.fn(),
}))

vi.mock('@/campo/hooks/videoCompression', () => ({
  compressVideo: vi.fn(),
}))

vi.mock('@/campo/hooks/videoValidation', () => ({
  validateVideoDuration: vi.fn(),
}))

const mockUseLiveQuery = vi.fn()
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}))

function makeFile(name: string, size: number, type: string): File {
  return new File([new ArrayBuffer(size)], name, { type })
}

const mockItem = {
  id: 'item-1',
  projectId: 'proj-1',
  locationId: null,
  description: 'Test item',
  category: 'other' as const,
  status: 'pending' as const,
  deletedAt: null,
  deletedById: null,
  updatedAt: new Date(),
  technicianId: 'tech-1',
  syncedAt: null,
  conflictStatus: false,
  conflictRemoteStatus: null,
}

beforeEach(async () => {
  vi.clearAllMocks()
  await db.delete()
  await db.open()
  mockUseLiveQuery.mockReturnValue({ item: mockItem, evidences: [], locations: [] })
})

describe('useItemEdit', () => {
  it('rejeita vídeo com duração acima de VIDEO_MAX_DURATION_SEC antes da compressão', async () => {
    vi.mocked(validateVideoDuration).mockResolvedValue(
      `Vídeo muito longo — máximo ${VIDEO_MAX_DURATION_SEC} segundos`
    )

    const { result } = renderHook(() => useItemEdit('item-1', 'proj-1', vi.fn(), false))

    const file = makeFile('v.mp4', 1024, 'video/mp4')
    act(() => {
      result.current.addMedia('video', [file])
    })

    await waitFor(() => expect(result.current.isProcessingMedia).toBe(false))

    expect(validateVideoDuration).toHaveBeenCalledWith(file, VIDEO_MAX_DURATION_SEC)
    expect(compressVideo).not.toHaveBeenCalled()
    expect(result.current.pendingMedia).toHaveLength(0)
    expect(toast.error).toHaveBeenCalledWith(
      `Vídeo muito longo — máximo ${VIDEO_MAX_DURATION_SEC} segundos`
    )
  })

  it('exibe toast e não adiciona mídia quando arquivo pós-compressão excede limite', async () => {
    const oversized = makeFile('f.jpg', PHOTO_MAX_BYTES + 1, 'image/jpeg')
    vi.mocked(compressImage).mockResolvedValue(oversized)

    const { result } = renderHook(() => useItemEdit('item-1', 'proj-1', vi.fn(), false))

    const file = makeFile('f.jpg', 1024, 'image/jpeg')
    act(() => {
      result.current.addMedia('photo', [file])
    })

    await waitFor(() => expect(result.current.isProcessingMedia).toBe(false))

    expect(result.current.pendingMedia).toHaveLength(0)
    expect(toast.error).toHaveBeenCalledWith('Foto excede limite após compressão')
  })

  it('chama enqueueEvidenceDelete antes de db.evidence.delete no save', async () => {
    const evidenceId = 'ev-1'
    mockUseLiveQuery.mockReturnValue({
      item: mockItem,
      evidences: [
        {
          id: evidenceId,
          itemId: 'item-1',
          type: 'photo' as const,
          blob: new Blob(),
          storagePath: null,
          comment: null,
          createdAt: new Date(),
          technicianId: 'tech-1',
          syncedAt: new Date(),
        },
      ],
      locations: [],
    })

    await db.items.put(mockItem)
    await db.evidence.add({
      id: evidenceId,
      itemId: 'item-1',
      type: 'photo',
      blob: new Blob(),
      storagePath: null,
      comment: null,
      createdAt: new Date(),
      technicianId: 'tech-1',
      syncedAt: new Date(),
    })

    const callOrder: string[] = []
    vi.mocked(enqueueEvidenceDelete).mockImplementation(async () => {
      callOrder.push('enqueue')
    })
    const deleteSpy = vi.spyOn(db.evidence, 'delete').mockImplementation((() => {
      callOrder.push('delete')
      return Promise.resolve() as ReturnType<typeof db.evidence.delete>
    }) as typeof db.evidence.delete)
    vi.mocked(enqueueItemUpdate).mockResolvedValue(undefined)

    const { result } = renderHook(() => useItemEdit('item-1', 'proj-1', vi.fn(), false))

    act(() => {
      result.current.markDelete(evidenceId)
    })

    await act(async () => {
      await result.current.handleSave()
    })

    expect(enqueueEvidenceDelete).toHaveBeenCalledWith(evidenceId, 'item-1')
    expect(deleteSpy).toHaveBeenCalledWith(evidenceId)
    expect(callOrder).toEqual(['enqueue', 'delete'])
  })
})
