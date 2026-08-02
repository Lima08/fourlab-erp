import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VIDEO_COMPRESS_THRESHOLD_BYTES, VIDEO_MAX_BYTES } from '@/shared/constants/evidenceLimits'
import { compressVideo } from './videoCompression'

type VideoListener = () => void

class MockVideoElement {
  muted = false
  duration = 30
  private listeners = new Map<string, VideoListener>()
  private _src = ''

  get src() {
    return this._src
  }

  set src(value: string) {
    this._src = value
    queueMicrotask(() => this.emit('loadedmetadata'))
  }

  addEventListener(event: string, listener: VideoListener) {
    this.listeners.set(event, listener)
  }

  captureStream() {
    return {} as MediaStream
  }

  play() {
    return Promise.resolve()
  }

  emit(event: string) {
    this.listeners.get(event)?.()
  }
}

class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true)

  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null
  options: { mimeType?: string; videoBitsPerSecond?: number }

  constructor(_stream: MediaStream, options: { mimeType?: string; videoBitsPerSecond?: number }) {
    this.options = options
  }

  start() {
    this.ondataavailable?.({ data: new Blob([new ArrayBuffer(1024)], { type: 'video/webm' }) })
    this.onstop?.()
  }

  stop() {
    this.onstop?.()
  }
}

let mockVideo: MockVideoElement

function makeFile(name: string, sizeBytes: number, type = 'video/mp4'): File {
  return new File([new ArrayBuffer(sizeBytes)], name, { type })
}

beforeEach(() => {
  mockVideo = new MockVideoElement()
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'video') return mockVideo as unknown as HTMLVideoElement
    return document.createElement(tag)
  })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  vi.stubGlobal('MediaRecorder', MockMediaRecorder)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('compressVideo', () => {
  it('retorna arquivo inalterado no fast path (≤ VIDEO_COMPRESS_THRESHOLD_BYTES)', async () => {
    const file = makeFile('clip.mp4', VIDEO_COMPRESS_THRESHOLD_BYTES)

    const result = await compressVideo(file)

    expect(result).toBe(file)
    expect(document.createElement).not.toHaveBeenCalled()
  })

  it('re-encode via MediaRecorder no slow path e retorna arquivo comprimido', async () => {
    const original = makeFile('clip.mp4', VIDEO_COMPRESS_THRESHOLD_BYTES + 1)

    const result = await compressVideo(original)

    expect(result.size).toBeLessThan(original.size)
    expect(result.name).toBe('clip.mp4')
    expect(URL.revokeObjectURL).toHaveBeenCalled()
  })

  it('lança erro quando arquivo comprimido ainda excede VIDEO_MAX_BYTES', async () => {
    class OversizeRecorder extends MockMediaRecorder {
      start() {
        this.ondataavailable?.({
          data: new Blob([new ArrayBuffer(VIDEO_MAX_BYTES + 1)], { type: 'video/webm' }),
        })
        this.onstop?.()
      }
    }
    vi.stubGlobal('MediaRecorder', OversizeRecorder)

    const original = makeFile('clip.mp4', VIDEO_COMPRESS_THRESHOLD_BYTES + 1)

    await expect(compressVideo(original)).rejects.toThrow('Vídeo excede limite após compressão')
  })
})
