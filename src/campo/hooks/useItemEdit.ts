import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { db } from '@/shared/db/dexie'
import {
  enqueueEvidenceAdd,
  enqueueEvidenceDelete,
  enqueueItemAdd,
  enqueueItemUpdate,
} from '@/shared/services/sync/queueProcessor'
import { recomputeProjectProgress } from '@/campo/utils/inspectionStats'
import { useAuthStore } from '@/shared/stores/authStore'
import { compressImage } from '@/campo/hooks/imageCompression'
import { compressVideo } from '@/campo/hooks/videoCompression'
import { validateVideoDuration } from '@/campo/hooks/videoValidation'
import {
  PHOTO_MAX_BYTES,
  PHOTO_PRE_COMPRESS_MAX_BYTES,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_DURATION_SEC,
  VIDEO_PRE_COMPRESS_MAX_BYTES,
} from '@/shared/constants/evidenceLimits'
import type { Evidence, Location, Item, ItemCategory, ItemStatus } from '@/shared/db/dexie'

export interface ItemEditForm {
  description: string
  category: ItemCategory
  locationId: string // empty string = no location (null when persisted)
  status: ItemStatus
}

export interface PendingMedia {
  id: string
  type: 'photo' | 'video'
  file: File
  createdAt: Date
  technicianId: string
}

const ALLOWED_TYPES: Record<'photo' | 'video', RegExp> = {
  photo: /^image\/(jpeg|png|webp|heic|heif)$/,
  video: /^video\/(mp4|quicktime|webm|3gpp)$/,
}

function validateMedia(type: 'photo' | 'video', file: File): string | null {
  if (!ALLOWED_TYPES[type].test(file.type)) return `Tipo inválido: ${file.type}`
  const maxBytes = type === 'photo' ? PHOTO_PRE_COMPRESS_MAX_BYTES : VIDEO_PRE_COMPRESS_MAX_BYTES
  if (file.size > maxBytes) return `Arquivo muito grande (máx ${maxBytes / 1024 / 1024} MB)`
  return null
}

export interface UseItemEditResult {
  item: Item | undefined
  locations: Location[]
  isLoading: boolean
  form: ItemEditForm
  patchForm: (patch: Partial<ItemEditForm>) => void
  evidences: Evidence[]
  pendingComments: string[]
  addPendingComment: (text: string) => void
  updatePendingComment: (index: number, text: string) => void
  removePendingComment: (index: number) => void
  pendingDeletes: Set<string>
  markDelete: (id: string) => void
  pendingMedia: PendingMedia[]
  addMedia: (type: 'photo' | 'video', files: File[]) => void
  removePendingMedia: (id: string) => void
  evidenceCount: number
  canSave: boolean
  isProcessingMedia: boolean
  handleSave: () => Promise<void>
  isSaving: boolean
}

export function useItemEdit(
  itemId: string,
  projectId: string,
  onClose: () => void,
  isNew = false,
  initialLocationId: string | null = null
): UseItemEditResult {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const [userChanges, setUserChanges] = useState<Partial<ItemEditForm>>({})
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set())
  const [pendingComments, setPendingComments] = useState<string[]>([])
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessingMedia, setIsProcessingMedia] = useState(false)

  const data = useLiveQuery(
    () =>
      Promise.all([
        db.items.get(itemId),
        db.evidence.where('itemId').equals(itemId).toArray(),
        db.locations.where('projectId').equals(projectId).toArray(),
      ]).then(([item, evidences, locations]) => ({ item, evidences, locations })),
    [itemId, projectId]
  )

  const form = useMemo<ItemEditForm>(
    () => ({
      description: userChanges.description ?? data?.item?.description ?? '',
      category: userChanges.category ?? data?.item?.category ?? 'other',
      locationId: userChanges.locationId ?? data?.item?.locationId ?? initialLocationId ?? '',
      status: userChanges.status ?? data?.item?.status ?? 'pending',
    }),
    [userChanges, data?.item, initialLocationId]
  )

  const patchForm = (patch: Partial<ItemEditForm>) =>
    setUserChanges((prev) => ({ ...prev, ...patch }))

  const evidences = useMemo(
    () => (data?.evidences ?? []).filter((e) => !pendingDeletes.has(e.id)),
    [data?.evidences, pendingDeletes]
  )

  const evidenceCount = useMemo(
    () => evidences.length + pendingMedia.length + pendingComments.filter((c) => c.trim()).length,
    [evidences.length, pendingMedia.length, pendingComments]
  )

  const canSave =
    form.description.trim().length > 0 &&
    (form.status !== 'irregular' || evidenceCount > 0) &&
    !isProcessingMedia

  const markDelete = (id: string) => setPendingDeletes((prev) => new Set([...prev, id]))

  const addPendingComment = (text: string) => setPendingComments((prev) => [...prev, text])

  const updatePendingComment = (index: number, text: string) =>
    setPendingComments((prev) => prev.map((c, i) => (i === index ? text : c)))

  const removePendingComment = (index: number) =>
    setPendingComments((prev) => prev.filter((_, i) => i !== index))

  const addMedia = (type: 'photo' | 'video', files: File[]) => {
    void (async () => {
      setIsProcessingMedia(true)
      try {
        const now = new Date()
        const valid: PendingMedia[] = []

        for (const file of files) {
          const err = validateMedia(type, file)
          if (err) {
            toast.error(err)
            continue
          }

          if (type === 'video') {
            try {
              const durationErr = await validateVideoDuration(file, VIDEO_MAX_DURATION_SEC)
              if (durationErr) {
                toast.error(durationErr)
                continue
              }
            } catch {
              toast.error('Não foi possível verificar a duração do vídeo')
              continue
            }
          }

          let processedFile = file
          try {
            processedFile = type === 'photo' ? await compressImage(file) : await compressVideo(file)
          } catch {
            toast.error(type === 'photo' ? 'Falha ao comprimir imagem' : 'Falha ao comprimir vídeo')
            continue
          }

          const postCompressMax = type === 'photo' ? PHOTO_MAX_BYTES : VIDEO_MAX_BYTES
          if (processedFile.size > postCompressMax) {
            toast.error(
              type === 'photo'
                ? 'Foto excede limite após compressão'
                : 'Vídeo excede limite após compressão'
            )
            continue
          }

          valid.push({
            id: crypto.randomUUID(),
            type,
            file: processedFile,
            createdAt: now,
            technicianId: userId,
          })
        }

        if (valid.length > 0) setPendingMedia((prev) => [...prev, ...valid])
      } finally {
        setIsProcessingMedia(false)
      }
    })()
  }

  const removePendingMedia = (id: string) =>
    setPendingMedia((prev) => prev.filter((m) => m.id !== id))

  const handleSave = async () => {
    const existing = data?.item
    if (!canSave) return
    if (!isNew && !existing) return

    setIsSaving(true)
    try {
      const now = new Date()

      if (isNew) {
        await db.items.add({
          id: itemId,
          projectId,
          locationId: form.locationId || null,
          description: form.description.trim(),
          category: form.category,
          status: form.status,
          deletedAt: null,
          deletedById: null,
          updatedAt: now,
          technicianId: userId,
          syncedAt: null,
          conflictStatus: false,
          conflictRemoteStatus: null,
        })
      } else {
        await db.items.update(itemId, {
          description: form.description,
          category: form.category,
          locationId: form.locationId || null,
          status: form.status,
          updatedAt: now,
          syncedAt: null,
          conflictStatus: false,
          conflictRemoteStatus: null,
        })
      }

      if (pendingDeletes.size > 0) {
        await Promise.all([...pendingDeletes].map((id) => enqueueEvidenceDelete(id, itemId)))
        await Promise.all([...pendingDeletes].map((id) => db.evidence.delete(id)))
      }

      const commentEvidences: Evidence[] = []
      for (const comment of pendingComments) {
        const trimmed = comment.trim()
        if (!trimmed) continue
        const ev: Evidence = {
          id: crypto.randomUUID(),
          itemId,
          type: 'comment',
          blob: null,
          storagePath: null,
          comment: trimmed,
          createdAt: now,
          technicianId: userId,
          syncedAt: null,
        }
        await db.evidence.add(ev)
        commentEvidences.push(ev)
      }

      const mediaEvidences: Evidence[] = await Promise.all(
        pendingMedia.map(async (m) => {
          const ev: Evidence = {
            id: crypto.randomUUID(),
            itemId,
            type: m.type,
            blob: m.file,
            storagePath: null,
            comment: null,
            createdAt: now,
            technicianId: userId,
            syncedAt: null,
          }
          await db.evidence.add(ev)
          return ev
        })
      )

      const updated = await db.items.get(itemId)
      if (updated && !updated.deletedAt) {
        await (isNew ? enqueueItemAdd(updated) : enqueueItemUpdate(updated))
      }
      await Promise.all([
        ...commentEvidences.map((ev) => enqueueEvidenceAdd(ev)),
        ...mediaEvidences.map((ev) => enqueueEvidenceAdd(ev)),
      ])

      await recomputeProjectProgress(projectId)

      onClose()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        toast.error('Sem espaço no dispositivo — libere espaço ou sincronize e tente novamente')
      } else {
        toast.error('Falha ao salvar item — tente novamente')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return {
    item: data?.item,
    locations: data?.locations ?? [],
    isLoading: data === undefined,
    form,
    patchForm,
    evidences,
    pendingComments,
    addPendingComment,
    updatePendingComment,
    removePendingComment,
    pendingDeletes,
    markDelete,
    pendingMedia,
    addMedia,
    removePendingMedia,
    evidenceCount,
    canSave,
    isProcessingMedia,
    handleSave,
    isSaving,
  }
}
