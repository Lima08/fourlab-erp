import {
  VIDEO_COMPRESS_THRESHOLD_BYTES,
  VIDEO_MAX_BYTES,
} from '@/shared/constants/evidenceLimits'

const TARGET_BYTES = 45 * 1024 * 1024
const LOAD_TIMEOUT_MS = 30_000

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')

    const cleanup = () => URL.revokeObjectURL(url)

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Não foi possível carregar o vídeo'))
    }, LOAD_TIMEOUT_MS)

    video.addEventListener('loadedmetadata', () => {
      clearTimeout(timer)
      cleanup()
      resolve(video.duration)
    })

    video.addEventListener('error', () => {
      clearTimeout(timer)
      cleanup()
      reject(new Error('Falha ao carregar vídeo'))
    })

    video.src = url
  })
}

function pickMimeType(): string {
  const candidates = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4']
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return 'video/webm'
}

async function reencodeVideo(file: File, videoBitrate: number): Promise<File> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true

  await new Promise<void>((resolve, reject) => {
    video.addEventListener('loadedmetadata', () => resolve())
    video.addEventListener('error', () => reject(new Error('Falha ao carregar vídeo')))
    video.src = url
  })

  const stream = (video as HTMLVideoElement & { captureStream(): MediaStream }).captureStream()
  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: videoBitrate })

  return new Promise((resolve, reject) => {
    const chunks: Blob[] = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }

    recorder.onstop = () => {
      URL.revokeObjectURL(url)
      const blob = new Blob(chunks, { type: mimeType })
      resolve(new File([blob], file.name, { type: mimeType }))
    }

    recorder.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Falha ao comprimir vídeo'))
    }

    video.addEventListener('ended', () => recorder.stop())

    video
      .play()
      .then(() => recorder.start())
      .catch((err: unknown) => {
        URL.revokeObjectURL(url)
        reject(err instanceof Error ? err : new Error('Falha ao reproduzir vídeo'))
      })
  })
}

export async function compressVideo(file: File): Promise<File> {
  if (file.size <= VIDEO_COMPRESS_THRESHOLD_BYTES) return file

  const duration = await getVideoDuration(file)
  if (duration <= 0) throw new Error('Duração de vídeo inválida')

  const targetBitrate = Math.floor((TARGET_BYTES * 8) / duration)
  const compressed = await reencodeVideo(file, targetBitrate)

  if (compressed.size > VIDEO_MAX_BYTES) {
    throw new Error('Vídeo excede limite após compressão')
  }

  return compressed
}
