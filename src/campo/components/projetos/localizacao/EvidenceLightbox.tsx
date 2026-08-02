import { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Loader2Icon } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { usePhotoDataUrl, useVideoObjectUrl } from '@/campo/hooks/useMediaDisplayUrl'

export interface PreviewMediaItem {
  id: string
  type: 'photo' | 'video'
  blob: Blob | null
}

interface Props {
  open: boolean
  items: PreviewMediaItem[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
  resolveBlob: (item: PreviewMediaItem) => Promise<Blob>
}

const NAV_BUTTON_CLS =
  'absolute top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white ring-2 ring-white/30 backdrop-blur-sm transition-colors hover:bg-black/70 disabled:pointer-events-none disabled:opacity-30'

interface MediaPanelProps {
  item: PreviewMediaItem
  resolveBlob: (item: PreviewMediaItem) => Promise<Blob>
}

function MediaPanel({ item, resolveBlob }: MediaPanelProps) {
  const hasLocalBlob = item.blob !== null
  const [fetchedBlob, setFetchedBlob] = useState<Blob | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const generationRef = useRef(0)

  const displayBlob = item.blob ?? fetchedBlob
  const isFetchingRemote = !hasLocalBlob && fetchedBlob === null && fetchError === null

  useEffect(() => {
    if (hasLocalBlob) return

    const generation = ++generationRef.current

    resolveBlob(item)
      .then((resolved) => {
        if (generation !== generationRef.current) return
        setFetchedBlob(resolved)
      })
      .catch((err: unknown) => {
        if (generation !== generationRef.current) return
        setFetchError(err instanceof Error ? err.message : 'Falha ao carregar evidência')
      })

    return () => {
      generationRef.current += 1
    }
  }, [hasLocalBlob, item, resolveBlob])

  const photoDisplay = usePhotoDataUrl(
    item.type === 'photo' ? displayBlob : null,
    item.type === 'photo' && displayBlob !== null && !isFetchingRemote
  )
  const videoDisplay = useVideoObjectUrl(
    item.type === 'video' ? displayBlob : null,
    item.type === 'video' && displayBlob !== null && !isFetchingRemote
  )

  const loading =
    isFetchingRemote ||
    (item.type === 'photo' && photoDisplay.status === 'loading') ||
    (item.type === 'video' && videoDisplay.status === 'loading')

  const mediaError =
    fetchError !== null ||
    (item.type === 'photo' && photoDisplay.status === 'error') ||
    (item.type === 'video' && videoDisplay.status === 'error')

  if (loading) {
    return (
      <div
        data-testid="evidence-lightbox-loading"
        className="flex flex-col items-center gap-3 text-white"
      >
        <Loader2Icon className="size-10 animate-spin" />
        <p className="text-sm">Carregando evidência…</p>
      </div>
    )
  }

  if (mediaError) {
    return (
      <div
        data-testid="evidence-lightbox-error"
        className="flex max-w-sm flex-col items-center gap-4 px-6 text-center text-white"
      >
        <Icon name="cloud_off" className="text-4xl opacity-80" />
        <p className="text-sm">{fetchError ?? 'Falha ao carregar evidência'}</p>
      </div>
    )
  }

  if (item.type === 'photo' && photoDisplay.url) {
    return (
      <img
        data-testid="evidence-lightbox-photo"
        src={photoDisplay.url}
        alt="Evidência"
        className="max-h-[calc(100dvh-6rem)] max-w-[min(calc(100vw-2rem),100%)] object-contain"
      />
    )
  }

  if (item.type === 'video' && videoDisplay.url) {
    return (
      <VideoPlayer src={videoDisplay.url} />
    )
  }

  return null
}

function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <video
      ref={videoRef}
      data-testid="evidence-lightbox-video"
      src={src}
      controls
      autoPlay
      muted
      playsInline
      preload="auto"
      className="max-h-[calc(100dvh-6rem)] max-w-[min(calc(100vw-2rem),100%)]"
      onLoadedData={() => {
        void videoRef.current?.play().catch(() => undefined)
      }}
    />
  )
}

export function EvidenceLightbox({
  open,
  items,
  index,
  onIndexChange,
  onClose,
  resolveBlob,
}: Props) {
  const current = items[index]

  const goPrev = useCallback(() => onIndexChange(Math.max(0, index - 1)), [index, onIndexChange])
  const goNext = useCallback(
    () => onIndexChange(Math.min(items.length - 1, index + 1)),
    [index, items.length, onIndexChange]
  )

  if (!open || !current) return null

  const hasPrev = index > 0
  const hasNext = index < items.length - 1
  const showNav = items.length > 1

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-testid="evidence-lightbox-backdrop"
          className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-100 bg-black/90 duration-100"
          onClick={onClose}
        />
        <DialogPrimitive.Popup
          data-testid="evidence-lightbox"
          className={cn(
            'pointer-events-none fixed inset-0 z-100 flex items-center justify-center outline-none',
            'data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 duration-100'
          )}
        >
          <button
            type="button"
            data-testid="evidence-lightbox-close"
            aria-label="Fechar preview"
            className="pointer-events-auto absolute top-4 right-4 z-20 flex size-12 items-center justify-center rounded-full bg-black/50 text-white ring-2 ring-white/30 backdrop-blur-sm transition-colors hover:bg-black/70"
            onClick={onClose}
          >
            <Icon name="close" className="text-[22px]" />
          </button>

          {showNav && (
            <>
              <button
                type="button"
                data-testid="evidence-lightbox-prev"
                aria-label="Evidência anterior"
                disabled={!hasPrev}
                className={cn(NAV_BUTTON_CLS, 'pointer-events-auto left-4')}
                onClick={goPrev}
              >
                <Icon name="chevron_left" className="text-3xl" />
              </button>
              <button
                type="button"
                data-testid="evidence-lightbox-next"
                aria-label="Próxima evidência"
                disabled={!hasNext}
                className={cn(NAV_BUTTON_CLS, 'pointer-events-auto right-4')}
                onClick={goNext}
              >
                <Icon name="chevron_right" className="text-3xl" />
              </button>
            </>
          )}

          <div
            className="pointer-events-auto flex max-h-full max-w-full items-center justify-center p-4 pt-16 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <MediaPanel key={current.id} item={current} resolveBlob={resolveBlob} />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
