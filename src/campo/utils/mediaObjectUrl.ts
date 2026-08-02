const FALLBACK_MIME: Record<'photo' | 'video', string> = {
  photo: 'image/jpeg',
  video: 'video/mp4',
}

export function detectMimeFromBuffer(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer.slice(0, 16))
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    const tag = String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0)
    if (tag === 'WEBP') return 'image/webp'
  }
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0)
    if (brand.startsWith('hei') || brand.startsWith('mif1')) return 'image/heic'
    if (brand.includes('mp4') || brand.startsWith('iso') || brand.startsWith('qt')) return 'video/mp4'
    if (brand.startsWith('3gp')) return 'video/3gpp'
  }
  return null
}

function resolveMime(blob: Blob, media: 'photo' | 'video', detected: string | null): string {
  if (detected) return detected
  if (blob.type && blob.type !== 'application/octet-stream' && blob.type !== 'binary/octet-stream') {
    return blob.type
  }
  return FALLBACK_MIME[media]
}

/** Reconstrói blob a partir dos bytes — corrige blobs do IndexedDB sem type ou corrompidos. */
export async function prepareDisplayBlob(blob: Blob, media: 'photo' | 'video'): Promise<Blob> {
  const buffer = await blob.arrayBuffer()
  if (buffer.byteLength === 0) throw new Error('Arquivo de mídia vazio')

  const detected = detectMimeFromBuffer(buffer)
  const mime = resolveMime(blob, media, detected)

  if (mime === 'image/heic' || mime === 'image/heif') {
    throw new Error('Formato HEIC não suportado neste dispositivo')
  }

  return new Blob([buffer], { type: mime })
}

/** Data URL evita race de revokeObjectURL — ideal para fotos (≤1 MB comprimido). */
export async function createPhotoDataUrl(blob: Blob): Promise<string> {
  const prepared = await prepareDisplayBlob(blob, 'photo')
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Falha ao ler imagem'))
    }
    reader.onerror = () => reject(new Error('Falha ao ler imagem'))
    reader.readAsDataURL(prepared)
  })
}

export async function createVideoObjectUrl(blob: Blob): Promise<string> {
  const prepared = await prepareDisplayBlob(blob, 'video')
  return URL.createObjectURL(prepared)
}

/** @deprecated Prefer createPhotoDataUrl / createVideoObjectUrl */
export function createMediaObjectUrl(blob: Blob, media: 'photo' | 'video'): string {
  const fallback = FALLBACK_MIME[media]
  const needsType =
    !blob.type || blob.type === 'application/octet-stream' || blob.type === 'binary/octet-stream'
  const typed = needsType ? new Blob([blob], { type: fallback }) : blob
  return URL.createObjectURL(typed)
}
