import imageCompression from 'browser-image-compression'

const OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 4096,
  useWebWorker: true,
  initialQuality: 0.85,
}

export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, OPTIONS)
}
