import { useEffect, useRef, useState } from 'react'
import { createPhotoDataUrl, createVideoObjectUrl } from '@/campo/utils/mediaObjectUrl'

type DisplayStatus = 'idle' | 'loading' | 'ready' | 'error'

function blobToken(blob: Blob): string {
  return `${blob.size}:${blob.type}`
}

export function usePhotoDataUrl(
  blob: Blob | null,
  enabled: boolean
): { url: string | null; status: DisplayStatus } {
  const [result, setResult] = useState<{ token: string; url: string } | null>(null)
  const [error, setError] = useState(false)
  const generationRef = useRef(0)

  useEffect(() => {
    if (!enabled || !blob) return

    const generation = ++generationRef.current
    const token = blobToken(blob)

    void createPhotoDataUrl(blob)
      .then((dataUrl) => {
        if (generation !== generationRef.current) return
        setError(false)
        setResult({ token, url: dataUrl })
      })
      .catch(() => {
        if (generation !== generationRef.current) return
        setError(true)
        setResult(null)
      })
  }, [blob, enabled])

  if (!enabled || !blob) return { url: null, status: 'idle' }
  if (error) return { url: null, status: 'error' }
  if (!result || result.token !== blobToken(blob)) return { url: null, status: 'loading' }
  return { url: result.url, status: 'ready' }
}

export function useVideoObjectUrl(
  blob: Blob | null,
  enabled: boolean
): { url: string | null; status: DisplayStatus } {
  const [result, setResult] = useState<{ token: string; url: string } | null>(null)
  const [error, setError] = useState(false)
  const generationRef = useRef(0)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !blob) return

    const generation = ++generationRef.current
    const token = blobToken(blob)

    void createVideoObjectUrl(blob)
      .then((objectUrl) => {
        if (generation !== generationRef.current) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = objectUrl
        setError(false)
        setResult({ token, url: objectUrl })
      })
      .catch(() => {
        if (generation !== generationRef.current) return
        setError(true)
        setResult(null)
      })

    return () => {
      generationRef.current += 1
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [blob, enabled])

  if (!enabled || !blob) return { url: null, status: 'idle' }
  if (error) return { url: null, status: 'error' }
  if (!result || result.token !== blobToken(blob)) return { url: null, status: 'loading' }
  return { url: result.url, status: 'ready' }
}
