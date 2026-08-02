import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Menu } from '@base-ui/react/menu'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { db } from '@/shared/db/dexie'
import {
  downloadEvidenceBlob,
  evidenceStoragePath,
} from '@/shared/services/sync/evidenceDownload'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useItemEdit } from '@/campo/hooks/useItemEdit'
import { LocationEditModal } from '@/campo/components/projetos/detalhes/LocationEditModal'
import { EvidenceCard } from './EvidenceCard'
import { EvidenceLightbox, type PreviewMediaItem } from './EvidenceLightbox'
import type { ItemCategory, ItemStatus, Location } from '@/shared/db/dexie'

interface Props {
  itemId: string
  projectId: string
  onClose: () => void
  /** Só em edição — abre fluxo de remoção no parent */
  onDelete?: () => void
  isNew?: boolean
  initialLocationId?: string | null
}

const CATEGORY_ICONS: Record<ItemCategory, string> = {
  extinguisher: 'fire_extinguisher',
  emergency_exit: 'emergency',
  lighting: 'wb_twilight',
  sprinkler: 'water_drop',
  alarm: 'notifications_active',
  other: 'report_problem',
}

const CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = [
  { value: 'extinguisher', label: 'Extintores' },
  { value: 'emergency_exit', label: 'Saídas de Emergência' },
  { value: 'lighting', label: 'Iluminação' },
  { value: 'sprinkler', label: 'Sprinklers' },
  { value: 'alarm', label: 'Alarmes' },
  { value: 'other', label: 'Geral' },
]

const STATUS_OPTIONS: {
  value: ItemStatus
  label: string
  icon: string
  fill?: boolean
  activeText: string
}[] = [
  { value: 'pending', label: 'Pendente', icon: 'schedule', activeText: 'text-industrial-600' },
  {
    value: 'regular',
    label: 'Regular',
    icon: 'check_circle',
    fill: true,
    activeText: 'text-emerald-700',
  },
  { value: 'irregular', label: 'Irregular', icon: 'warning', activeText: 'text-red-700' },
  { value: 'absent', label: 'Ausente', icon: 'remove_circle', activeText: 'text-amber-600' },
]

const CAPTURE_BUTTON_CLS =
  'flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-industrial-200 text-sm font-medium text-industrial-500 transition-all hover:border-safety-blue hover:bg-industrial-50 hover:text-safety-blue'

const GALLERY_MENU_ITEM_CLS = cn(
  'flex w-full cursor-pointer items-center gap-2 px-3 py-2 outline-none',
  'hover:bg-industrial-50 focus:bg-industrial-50'
)

const PHOTO_CAMERA_BUTTON = {
  label: 'Tirar Foto',
  icon: 'photo_camera',
  inputId: 'item-photo-camera',
  testId: 'btn-photo-camera',
}

const VIDEO_CAMERA_BUTTON = {
  label: 'Gravar Vídeo',
  icon: 'videocam',
  inputId: 'item-video-camera',
  testId: 'btn-video-camera',
}

const COMMENT_BUTTON = {
  label: 'Comentário',
  icon: 'chat',
  testId: 'btn-comment',
}

const DISCARD_CONFIRM_MSG = 'Há evidências não salvas. Deseja descartar essas alterações?'

const CREATE_LOCATION_VALUE = '__create_location__'

export function ItemEditModal({
  itemId,
  projectId,
  onClose,
  onDelete,
  isNew = false,
  initialLocationId = null,
}: Props) {
  const {
    locations,
    isLoading,
    form,
    patchForm,
    evidences,
    pendingComments,
    addPendingComment,
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
  } = useItemEdit(itemId, projectId, onClose, isNew, initialLocationId)

  const photoGalleryRef = useRef<HTMLInputElement>(null)
  const videoGalleryRef = useRef<HTMLInputElement>(null)
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const latestEvidenceRef = useRef<HTMLDivElement>(null)

  const [composerOpen, setComposerOpen] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [locationCreateOpen, setLocationCreateOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const previewItems = useMemo<PreviewMediaItem[]>(() => {
    const persisted = evidences
      .filter(
        (ev) =>
          !pendingDeletes.has(ev.id) && (ev.type === 'photo' || ev.type === 'video')
      )
      .map((ev) => ({
        id: ev.id,
        type: ev.type as 'photo' | 'video',
        blob: ev.blob,
      }))

    const pending = pendingMedia.map((m) => ({
      id: m.id,
      type: m.type,
      blob: m.file,
    }))

    return [...persisted, ...pending]
  }, [evidences, pendingDeletes, pendingMedia])

  const resolvePreviewBlob = useCallback(
    async (item: PreviewMediaItem): Promise<Blob> => {
      if (item.blob) return item.blob

      if (!navigator.onLine) {
        throw new Error('Evidência indisponível offline')
      }

      const path = evidenceStoragePath(projectId, itemId, item.id)
      const blob = await downloadEvidenceBlob(path)
      await db.evidence.update(item.id, { blob, syncedAt: new Date() })
      return blob
    },
    [itemId, projectId]
  )

  const handlePreview = useCallback(
    (evidenceId: string) => {
      const index = previewItems.findIndex((item) => item.id === evidenceId)
      if (index < 0) return

      const item = previewItems[index]
      if (!item) return
      if (!item.blob && !navigator.onLine) {
        toast.error('Evidência indisponível offline')
        return
      }

      setPreviewIndex(index)
      setPreviewOpen(true)
    },
    [previewItems]
  )

  const closePreviewIfRemoved = useCallback(
    (evidenceId: string) => {
      if (previewOpen && previewItems[previewIndex]?.id === evidenceId) {
        setPreviewOpen(false)
      }
    },
    [previewOpen, previewItems, previewIndex]
  )

  const handleMarkDelete = useCallback(
    (evidenceId: string) => {
      markDelete(evidenceId)
      closePreviewIfRemoved(evidenceId)
    },
    [markDelete, closePreviewIfRemoved]
  )

  const handleRemovePendingMedia = useCallback(
    (evidenceId: string) => {
      removePendingMedia(evidenceId)
      closePreviewIfRemoved(evidenceId)
    },
    [removePendingMedia, closePreviewIfRemoved]
  )

  const isIrregular = form.status === 'irregular'
  const modalTitle = isNew
    ? 'Novo Item'
    : form.description.trim() || (isIrregular ? 'Detalhes da Irregularidade' : 'Detalhes do Item')
  const showEvidenceWarning = isIrregular && evidenceCount === 0
  const canAddComment = commentDraft.trim().length > 0

  const hasUnsavedEvidence =
    pendingComments.length > 0 ||
    pendingMedia.length > 0 ||
    pendingDeletes.size > 0 ||
    isProcessingMedia ||
    commentDraft.trim().length > 0

  const hasEvidenceList =
    evidences.length > 0 || pendingMedia.length > 0 || pendingComments.length > 0

  useEffect(() => {
    if (!composerOpen) return
    commentTextareaRef.current?.focus()
  }, [composerOpen])

  const openComposer = () => {
    setComposerOpen(true)
    requestAnimationFrame(() => commentTextareaRef.current?.focus())
  }

  const closeComposer = () => {
    setComposerOpen(false)
    setCommentDraft('')
  }

  const confirmAddComment = () => {
    const trimmed = commentDraft.trim()
    if (!trimmed) return
    addPendingComment(trimmed)
    closeComposer()
    requestAnimationFrame(() => {
      latestEvidenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const requestClose = () => {
    if (hasUnsavedEvidence && !window.confirm(DISCARD_CONFIRM_MSG)) return
    onClose()
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(open, eventDetails) => {
          if (open) return
          // Menu da galeria (portal) e file picker tiram o foco do dialog —
          // não fechar o modal nesses casos para não perder evidências pendentes.
          if (eventDetails.reason === 'outside-press' || eventDetails.reason === 'focus-out') {
            eventDetails.cancel()
            return
          }
          if (hasUnsavedEvidence) {
            eventDetails.cancel()
            requestClose()
            return
          }
          onClose()
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[90vh] flex-col gap-0 bg-white p-0 sm:max-w-2xl"
        >
          <div className="border-industrial-200 flex shrink-0 items-center justify-between gap-3 border-b px-6 py-5">
            <h2 className="text-industrial-900 min-w-0 flex-1 truncate text-xl font-bold">
              {modalTitle}
            </h2>
            <DialogClose
              render={
                <button
                  type="button"
                  disabled={isSaving}
                  className="text-industrial-500 hover:bg-industrial-100 flex size-12 shrink-0 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-50"
                  aria-label="Fechar modal"
                />
              }
            >
              <Icon name="close" className="text-[22px]" />
            </DialogClose>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2Icon className="text-industrial-400 size-8 animate-spin" />
              </div>
            ) : (
              <>
                <section>
                  <h3 className="text-industrial-500 mb-3 text-xs font-semibold tracking-wider uppercase">
                    Status do Item
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {STATUS_OPTIONS.map((opt) => {
                      const isActive = form.status === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => patchForm({ status: opt.value })}
                          className={[
                            'flex h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 text-[14px] font-bold transition-colors duration-200 active:scale-95',
                            isActive
                              ? `border-industrial-900 ring-industrial-900/10 bg-slate-50 ring-2 ${opt.activeText}`
                              : 'border-industrial-200 text-industrial-500 hover:border-industrial-300 bg-white',
                          ].join(' ')}
                        >
                          <Icon name={opt.icon} fill={opt.fill} className="text-[22px]" />
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section>
                  <h3 className="text-industrial-500 mb-3 text-xs font-semibold tracking-wider uppercase">
                    Informações Principais
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="item-description"
                        className="text-industrial-900 block text-xs font-semibold tracking-wider uppercase"
                      >
                        Nome do Item
                      </label>
                      <input
                        id="item-description"
                        type="text"
                        value={form.description}
                        onChange={(e) => patchForm({ description: e.target.value })}
                        className="border-industrial-200 text-industrial-900 focus:border-safety-blue focus:ring-safety-blue block h-12 w-full rounded-lg border bg-white p-3 text-sm font-medium focus:ring-1 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-industrial-900 block text-xs font-semibold tracking-wider uppercase">
                        Categoria
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_OPTIONS.map((opt) => {
                          const isActive = form.category === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => patchForm({ category: opt.value })}
                              className={[
                                'flex h-10 items-center gap-1.5 rounded-xl border-2 pr-3 pl-2.5 text-[13px] font-bold transition active:scale-95',
                                isActive
                                  ? 'border-industrial-900 bg-industrial-900 text-white'
                                  : 'border-industrial-200 text-industrial-600 hover:border-industrial-400 bg-white',
                              ].join(' ')}
                            >
                              <Icon name={CATEGORY_ICONS[opt.value]} className="text-[17px]" />
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-industrial-500 mb-3 text-xs font-semibold tracking-wider uppercase">
                    Localização
                  </h3>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
                      <Icon name="location_on" className="text-industrial-400 text-lg" />
                    </div>
                    <Select
                      items={[
                        { value: '', label: 'Sem localização' },
                        ...locations.map((loc) => ({ value: loc.id, label: loc.name })),
                        { value: CREATE_LOCATION_VALUE, label: 'Criar localização' },
                      ]}
                      value={form.locationId}
                      onValueChange={(value) => {
                        if (value === CREATE_LOCATION_VALUE) {
                          setLocationCreateOpen(true)
                          return
                        }
                        if (value !== null) patchForm({ locationId: value })
                      }}
                    >
                      <SelectTrigger
                        aria-label="Localização"
                        className="border-industrial-200 text-industrial-900 focus:border-safety-blue focus:ring-safety-blue h-12 w-full border bg-white pl-10 text-sm font-medium outline-none focus:ring-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem localização</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                        <SelectItem value={CREATE_LOCATION_VALUE}>
                          <span className="text-safety-blue flex items-center gap-1.5">
                            <Icon name="add" className="text-[18px]" />
                            Criar localização
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </section>

                <section className="space-y-4">
                  <div>
                    <h3 className="text-industrial-500 text-xs font-semibold tracking-wider uppercase">
                      Evidências ({evidenceCount})
                    </h3>
                    {showEvidenceWarning && (
                      <p className="mt-2 text-sm text-red-600">
                        Adicione ao menos uma evidência para itens irregulares
                      </p>
                    )}
                  </div>

                  <input
                    id="item-photo-camera"
                    data-testid="photo-camera-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => {
                      addMedia('photo', Array.from(e.target.files ?? []))
                      e.target.value = ''
                    }}
                  />
                  <input
                    ref={photoGalleryRef}
                    id="item-photo-gallery"
                    data-testid="photo-gallery-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addMedia('photo', Array.from(e.target.files ?? []))
                      e.target.value = ''
                    }}
                  />
                  <input
                    id="item-video-camera"
                    data-testid="video-camera-input"
                    type="file"
                    accept="video/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) addMedia('video', [file])
                      e.target.value = ''
                    }}
                  />
                  <input
                    ref={videoGalleryRef}
                    id="item-video-gallery"
                    data-testid="video-gallery-input"
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) addMedia('video', [file])
                      e.target.value = ''
                    }}
                  />

                  {hasEvidenceList && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {evidences.map((ev) => (
                        <EvidenceCard
                          key={ev.id}
                          evidence={ev}
                          onDelete={handleMarkDelete}
                          onPreview={handlePreview}
                        />
                      ))}

                      {pendingMedia.map((m) => (
                        <EvidenceCard
                          key={m.id}
                          evidence={{
                            id: m.id,
                            itemId,
                            type: m.type,
                            blob: m.file,
                            storagePath: null,
                            comment: null,
                            createdAt: m.createdAt,
                            technicianId: m.technicianId,
                            syncedAt: null,
                          }}
                          onDelete={handleRemovePendingMedia}
                          onPreview={handlePreview}
                        />
                      ))}

                      {pendingComments.map((text, index) => (
                        <div
                          key={`pending-comment-${index}`}
                          className="col-span-2"
                          ref={index === pendingComments.length - 1 ? latestEvidenceRef : undefined}
                        >
                          <EvidenceCard
                            evidence={{
                              id: `pending-comment-${index}`,
                              itemId,
                              type: 'comment',
                              blob: null,
                              storagePath: null,
                              comment: text,
                              createdAt: new Date(0),
                              technicianId: '',
                              syncedAt: null,
                            }}
                            onDelete={() => removePendingComment(index)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {composerOpen && (
                    <div
                      data-testid="comment-composer"
                      className="border-safety-blue ring-safety-blue overflow-hidden rounded-xl border bg-white ring-1"
                    >
                      <div className="border-industrial-100 bg-industrial-50 flex items-center gap-2 border-b px-3 py-2">
                        <Icon name="chat" className="text-safety-blue text-[20px]" />
                        <span className="text-industrial-700 text-xs font-semibold">
                          Nova observação
                        </span>
                      </div>
                      <textarea
                        ref={commentTextareaRef}
                        data-testid="comment-composer-input"
                        rows={3}
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder="Descreva os detalhes..."
                        className="text-industrial-900 placeholder:text-industrial-400 w-full resize-none border-0 bg-white p-3 text-sm focus:ring-0 focus:outline-none"
                      />
                      <div className="border-industrial-100 flex items-center justify-end gap-2 border-t bg-white px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          data-testid="comment-composer-cancel"
                          onClick={closeComposer}
                          className="text-industrial-500"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          data-testid="comment-composer-add"
                          onClick={confirmAddComment}
                          disabled={!canAddComment}
                          className="bg-industrial-900 hover:bg-industrial-800"
                        >
                          <Icon name="add" className="mr-1 text-[18px]" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <label
                      htmlFor={PHOTO_CAMERA_BUTTON.inputId}
                      data-testid={PHOTO_CAMERA_BUTTON.testId}
                      className={CAPTURE_BUTTON_CLS}
                    >
                      <Icon name={PHOTO_CAMERA_BUTTON.icon} className="text-[20px]" />
                      {PHOTO_CAMERA_BUTTON.label}
                    </label>

                    <Menu.Root>
                      <Menu.Trigger data-testid="btn-gallery" className={CAPTURE_BUTTON_CLS}>
                        <Icon name="photo_library" className="text-[20px]" />
                        Da Galeria
                      </Menu.Trigger>
                      <Menu.Portal>
                        <Menu.Positioner
                          side="bottom"
                          align="center"
                          sideOffset={4}
                          className="z-100"
                        >
                          <Menu.Popup className="bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 min-w-40 overflow-hidden rounded-lg py-1 text-sm shadow-md ring-1">
                            <Menu.Item
                              data-testid="btn-gallery-photo"
                              onClick={() => photoGalleryRef.current?.click()}
                              className={GALLERY_MENU_ITEM_CLS}
                            >
                              <Icon
                                name="photo_library"
                                className="text-industrial-600 text-[18px]"
                              />
                              Foto
                            </Menu.Item>
                            <Menu.Item
                              data-testid="btn-gallery-video"
                              onClick={() => videoGalleryRef.current?.click()}
                              className={GALLERY_MENU_ITEM_CLS}
                            >
                              <Icon
                                name="video_library"
                                className="text-industrial-600 text-[18px]"
                              />
                              Vídeo
                            </Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>

                    <label
                      htmlFor={VIDEO_CAMERA_BUTTON.inputId}
                      data-testid={VIDEO_CAMERA_BUTTON.testId}
                      className={CAPTURE_BUTTON_CLS}
                    >
                      <Icon name={VIDEO_CAMERA_BUTTON.icon} className="text-[20px]" />
                      {VIDEO_CAMERA_BUTTON.label}
                    </label>

                    <button
                      type="button"
                      data-testid={COMMENT_BUTTON.testId}
                      onClick={openComposer}
                      className={CAPTURE_BUTTON_CLS}
                    >
                      <Icon name={COMMENT_BUTTON.icon} className="text-[20px]" />
                      {COMMENT_BUTTON.label}
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>

          <div className="border-industrial-200 flex shrink-0 flex-col-reverse gap-3 border-t bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            {!isNew && onDelete ? (
              <Button
                type="button"
                variant="outline"
                size="touch"
                disabled={isSaving}
                onClick={onDelete}
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
              >
                <Icon name="delete" className="mr-2 text-[20px]" />
                Remover
              </Button>
            ) : (
              <span className="hidden sm:block" />
            )}
            <Button
              size="touch"
              onClick={handleSave}
              disabled={isSaving || isLoading || !canSave}
              className="bg-industrial-900 hover:bg-industrial-800 w-full text-white sm:w-auto"
            >
              {isSaving ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              ) : (
                <Icon name="save" className="mr-2 text-[20px]" />
              )}
              {isNew ? 'Adicionar Item' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {locationCreateOpen && (
        <LocationEditModal
          projectId={projectId}
          onClose={() => setLocationCreateOpen(false)}
          onCreated={(location: Location) => {
            patchForm({ locationId: location.id })
          }}
        />
      )}

      <EvidenceLightbox
        open={previewOpen}
        items={previewItems}
        index={previewIndex}
        onIndexChange={setPreviewIndex}
        onClose={() => setPreviewOpen(false)}
        resolveBlob={resolvePreviewBlob}
      />
    </>
  )
}
