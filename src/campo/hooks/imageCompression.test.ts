import { describe, it, expect, vi, beforeEach } from 'vitest'
import { compressImage } from './imageCompression'

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}))

import imageCompression from 'browser-image-compression'

const mockCompress = vi.mocked(imageCompression)

function makeFile(name: string, sizeBytes: number, type = 'image/jpeg'): File {
  const buf = new ArrayBuffer(sizeBytes)
  return new File([buf], name, { type })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('compressImage', () => {
  it('comprime arquivo maior que 1 MB', async () => {
    const original = makeFile('foto.jpg', 2 * 1024 * 1024)
    const compressed = makeFile('foto.jpg', 500 * 1024)
    mockCompress.mockResolvedValue(compressed)

    const result = await compressImage(original)

    expect(mockCompress).toHaveBeenCalledWith(original, {
      maxSizeMB: 1,
      maxWidthOrHeight: 4096,
      useWebWorker: true,
      initialQuality: 0.85,
    })
    expect(result).toBe(compressed)
    expect(result.size).toBeLessThan(original.size)
  })

  it('passa arquivo menor que 1 MB com as opções corretas', async () => {
    const small = makeFile('foto.jpg', 300 * 1024)
    mockCompress.mockResolvedValue(small)

    await compressImage(small)

    expect(mockCompress).toHaveBeenCalledWith(small, {
      maxSizeMB: 1,
      maxWidthOrHeight: 4096,
      useWebWorker: true,
      initialQuality: 0.85,
    })
  })

  it('propaga erro quando a compressão falha', async () => {
    const file = makeFile('foto.jpg', 1 * 1024 * 1024)
    mockCompress.mockRejectedValue(new Error('compression failed'))

    await expect(compressImage(file)).rejects.toThrow('compression failed')
  })
})
