import { Loader2Icon } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { usePhotoDataUrl } from '@/campo/hooks/useMediaDisplayUrl'
import { useVideoThumbnail } from '@/campo/hooks/useVideoThumbnail'
import type { Evidence } from '@/shared/db/dexie'

interface Props {
  evidence: Evidence
  onDelete: (id: string) => void
  onPreview?: (id: string) => void
}

export function EvidenceCard({ evidence, onDelete, onPreview }: Props) {
  const isVideo = evidence.type === 'video'
  const isPhoto = evidence.type === 'photo'
  const isMedia = isPhoto || isVideo

  const photoDisplay = usePhotoDataUrl(isPhoto ? evidence.blob : null, isPhoto)
  const videoThumbnail = useVideoThumbnail(isVideo ? evidence.blob : null, isVideo)

  if (evidence.type === 'comment') {
    return (
      <div className="border-industrial-200 focus-within:border-safety-blue focus-within:ring-safety-blue col-span-2 overflow-hidden rounded-xl border bg-white focus-within:ring-1">
        <div className="border-industrial-100 bg-industrial-50 flex items-center gap-2 border-b px-3 py-2">
          <Icon name="notes" className="text-industrial-500 text-[20px]" />
          <span className="text-industrial-500 text-xs font-semibold">Observações do Inspetor</span>
          <button
            type="button"
            onClick={() => onDelete(evidence.id)}
            aria-label="Excluir observação"
            className="ml-auto rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
          >
            <Icon name="delete" className="text-[20px]" />
          </button>
        </div>
        <p className="text-industrial-700 p-3 text-sm">{evidence.comment}</p>
      </div>
    )
  }

  const fileName = isVideo
    ? `video_${evidence.id.slice(0, 8)}.mp4`
    : `foto_${evidence.id.slice(0, 8)}.jpg`
  const offlinePlaceholder =
    !evidence.blob &&
    evidence.storagePath !== null &&
    typeof navigator !== 'undefined' &&
    !navigator.onLine

  const thumbnailUrl =
    isPhoto && photoDisplay.status === 'ready'
      ? photoDisplay.url
      : isVideo && videoThumbnail.status === 'ready'
        ? videoThumbnail.url
        : null

  const showPhotoLoading = isPhoto && evidence.blob && photoDisplay.status === 'loading'
  const showVideoFallback =
    isVideo &&
    (videoThumbnail.status === 'error' || (!evidence.blob && videoThumbnail.status !== 'loading'))
  const showVideoLoading = isVideo && evidence.blob && videoThumbnail.status === 'loading'

  return (
    <div className="group border-industrial-200 relative flex flex-col overflow-hidden rounded-xl border bg-white">
      <div className="bg-industrial-100 relative h-32">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="Evidência" className="size-full object-cover" />
        ) : showPhotoLoading || showVideoLoading ? (
          <div
            data-testid="evidence-video-thumbnail-loading"
            className="text-industrial-400 flex size-full items-center justify-center"
          >
            <Loader2Icon className="size-8 animate-spin" />
          </div>
        ) : (
          <div className="text-industrial-300 flex size-full flex-col items-center justify-center gap-1 px-2 text-center">
            <Icon name={isVideo ? 'videocam' : 'photo_camera'} className="text-[40px]" />
            {offlinePlaceholder && (
              <span className="text-industrial-400 text-[10px] font-medium">
                Disponível só online — baixe mídias
              </span>
            )}
          </div>
        )}

        {isVideo && (thumbnailUrl || showVideoFallback || !evidence.blob) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-black/50 text-white ring-2 ring-white/30 backdrop-blur-sm">
              <Icon name="play_arrow" fill className="ml-1 text-2xl" />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/60 p-1.5 text-white backdrop-blur-md">
          <Icon name={isVideo ? 'videocam' : 'photo_camera'} className="text-sm" />
        </div>

        {isMedia && onPreview && (
          <button
            type="button"
            data-testid="evidence-preview-trigger"
            aria-label={isVideo ? 'Visualizar vídeo' : 'Visualizar foto'}
            className="absolute inset-0 cursor-pointer"
            onClick={() => onPreview(evidence.id)}
          />
        )}
      </div>

      <div className="border-industrial-100 flex items-center justify-between border-t bg-white p-3">
        <span className="text-industrial-500 truncate text-xs font-medium">{fileName}</span>
        <button
          type="button"
          onClick={() => onDelete(evidence.id)}
          aria-label={isVideo ? 'Excluir vídeo' : 'Excluir foto'}
          className="relative z-10 rounded-md p-1.5 text-red-600 transition-colors hover:bg-red-50"
        >
          <Icon name="delete" className="text-[20px]" />
        </button>
      </div>
    </div>
  )
}
