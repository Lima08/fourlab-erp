import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMediaObjectUrl,
  createPhotoDataUrl,
  detectMimeFromBuffer,
  prepareDisplayBlob,
} from './mediaObjectUrl'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:typed')
})

describe('detectMimeFromBuffer', () => {
  it('detecta JPEG pelos magic bytes', () => {
    const buffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer
    expect(detectMimeFromBuffer(buffer)).toBe('image/jpeg')
  })

  it('detecta PNG pelos magic bytes', () => {
    const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]).buffer
    expect(detectMimeFromBuffer(buffer)).toBe('image/png')
  })
})

describe('prepareDisplayBlob', () => {
  it('reconstrói blob sem MIME type com tipo detectado', async () => {
    const raw = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    const blob = new Blob([raw])
    const prepared = await prepareDisplayBlob(blob, 'photo')
    expect(prepared.type).toBe('image/jpeg')
    expect(prepared.size).toBe(raw.length)
  })

  it('rejeita blob vazio', async () => {
    await expect(prepareDisplayBlob(new Blob([]), 'photo')).rejects.toThrow('vazio')
  })
})

describe('createPhotoDataUrl', () => {
  it('retorna data URL para JPEG', async () => {
    const raw = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    const blob = new Blob([raw], { type: 'image/jpeg' })
    const dataUrl = await createPhotoDataUrl(blob)
    expect(dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true)
  })
})

describe('createMediaObjectUrl (legacy)', () => {
  it('aplica fallback image/jpeg quando blob não tem type', () => {
    const blob = new Blob(['img'])
    createMediaObjectUrl(blob, 'photo')
    const calledWith = vi.mocked(URL.createObjectURL).mock.calls.at(-1)?.[0] as Blob
    expect(calledWith.type).toBe('image/jpeg')
  })
})
