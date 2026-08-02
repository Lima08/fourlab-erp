import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { extractVideoThumbnail, useVideoThumbnail } from './useVideoThumbnail'

vi.mock('@/campo/utils/mediaObjectUrl', () => ({
  createVideoObjectUrl: vi.fn(async () => 'blob:video-src'),
}))

describe('extractVideoThumbnail', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejeita quando elemento video dispara erro', async () => {
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'video') {
        const el = document.createElementNS('http://www.w3.org/1999/xhtml', 'video')
        queueMicrotask(() => el.dispatchEvent(new Event('error')))
        return el
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tag)
    })

    const blob = new Blob(['video'], { type: 'video/mp4' })
    await expect(extractVideoThumbnail(blob)).rejects.toThrow('Falha ao extrair frame do vídeo')
  })
})

describe('useVideoThumbnail', () => {
  it('permanece idle quando blob é null', () => {
    const { result } = renderHook(() => useVideoThumbnail(null, true))
    expect(result.current.status).toBe('idle')
  })

  it('transiciona para loading imediatamente quando blob existe', () => {
    const blob = new Blob(['video'], { type: 'video/mp4' })
    const { result } = renderHook(() => useVideoThumbnail(blob, true))
    expect(result.current.status).toBe('loading')
  })
})
