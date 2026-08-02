import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateVideoDuration } from './videoValidation'

type VideoListener = () => void

class MockVideoElement {
  src = ''
  duration = 0
  private listeners = new Map<string, VideoListener>()

  addEventListener(event: string, listener: VideoListener) {
    this.listeners.set(event, listener)
  }

  emitLoadedMetadata() {
    this.listeners.get('loadedmetadata')?.()
  }
}

let mockVideo: MockVideoElement

beforeEach(() => {
  vi.useFakeTimers()
  mockVideo = new MockVideoElement()
  vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLVideoElement)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function makeVideoFile(): File {
  return new File([new ArrayBuffer(1024)], 'video.mp4', { type: 'video/mp4' })
}

describe('validateVideoDuration', () => {
  it('retorna erro quando duração excede o limite', async () => {
    const promise = validateVideoDuration(makeVideoFile(), 30)
    mockVideo.duration = 45
    mockVideo.emitLoadedMetadata()

    await expect(promise).resolves.toBe('Vídeo muito longo — máximo 30 segundos')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('retorna null quando duração é válida', async () => {
    const promise = validateVideoDuration(makeVideoFile(), 30)
    mockVideo.duration = 20
    mockVideo.emitLoadedMetadata()

    await expect(promise).resolves.toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })

  it('rejeita quando metadados não carregam dentro do timeout', async () => {
    const promise = validateVideoDuration(makeVideoFile(), 30)
    vi.advanceTimersByTime(5000)

    await expect(promise).rejects.toThrow('Não foi possível verificar a duração do vídeo')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })
})
