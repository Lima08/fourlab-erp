import { useEffect, useState } from 'react'
import { createVideoObjectUrl } from '@/campo/utils/mediaObjectUrl'

export type VideoThumbnailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'error' }

export async function extractVideoThumbnail(blob: Blob): Promise<string> {
  const objectUrl = await createVideoObjectUrl(blob)

  try {
    return await new Promise<string>((resolve, reject) => {
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
      video.src = objectUrl

      const fail = () => {
        video.removeAttribute('src')
        video.load()
        reject(new Error('Falha ao extrair frame do vídeo'))
      }

      video.addEventListener('error', fail, { once: true })

      video.addEventListener(
        'loadeddata',
        () => {
          try {
            video.currentTime = 0
          } catch {
            fail()
          }
        },
        { once: true }
      )

      video.addEventListener(
        'seeked',
        () => {
          try {
            const width = video.videoWidth || 320
            const height = video.videoHeight || 240
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              fail()
              return
            }
            ctx.drawImage(video, 0, 0, width, height)
            canvas.toBlob(
              (thumbBlob) => {
                video.removeAttribute('src')
                video.load()
                if (!thumbBlob) {
                  reject(new Error('Falha ao gerar thumbnail'))
                  return
                }
                resolve(URL.createObjectURL(thumbBlob))
              },
              'image/jpeg',
              0.85
            )
          } catch {
            fail()
          }
        },
        { once: true }
      )
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function useVideoThumbnail(blob: Blob | null, enabled: boolean): VideoThumbnailState {
  const [state, setState] = useState<VideoThumbnailState>({ status: 'idle' })

  useEffect(() => {
    if (!enabled || !blob) return

    let cancelled = false

    void extractVideoThumbnail(blob)
      .then((url) => {
        if (!cancelled) setState({ status: 'ready', url })
        else URL.revokeObjectURL(url)
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
      setState((prev) => {
        if (prev.status === 'ready') URL.revokeObjectURL(prev.url)
        return { status: 'idle' }
      })
    }
  }, [blob, enabled])

  if (!enabled || !blob) return { status: 'idle' }
  if (state.status === 'idle') return { status: 'loading' }
  return state
}
