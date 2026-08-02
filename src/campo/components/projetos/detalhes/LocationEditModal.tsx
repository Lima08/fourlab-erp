import { Loader2Icon } from 'lucide-react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useLocationEdit } from '@/campo/hooks/useLocationEdit'
import type { Location } from '@/shared/db/dexie'

interface Props {
  projectId: string
  /** undefined = modo create; Location = modo edit */
  location?: Location
  onClose: () => void
  /** Chamado após criar uma localização com sucesso */
  onCreated?: (location: Location) => void
}

const TYPE_OPTIONS: { value: Location['type']; label: string }[] = [
  { value: 'building', label: 'Edifício' },
  { value: 'floor', label: 'Pavimento' },
  { value: 'room', label: 'Sala' },
  { value: 'outdoor', label: 'Área Externa' },
  { value: 'other', label: 'Outro' },
]

export function LocationEditModal({ projectId, location, onClose, onCreated }: Props) {
  const isEditMode = location !== undefined
  const title = isEditMode ? 'Editar Localização' : 'Adicionar Localização'
  const primaryLabel = isEditMode ? 'Salvar Alterações' : 'Criar Localização'

  const {
    form,
    patchForm,
    nameError,
    isSaving,
    isDeleting,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleSave,
    handleDelete,
  } = useLocationEdit({
    locationId: location?.id,
    projectId,
    initialName: location?.name ?? '',
    initialType: location?.type ?? 'floor',
    onClose,
    onCreated,
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] flex-col gap-0 bg-white p-0 sm:max-w-md"
      >
        {/* Header */}
        <div className="border-industrial-200 flex shrink-0 items-center justify-between border-b px-6 py-4">
          <h3 className="text-industrial-900 text-lg font-bold">{title}</h3>
          <DialogClose
            render={
              <button
                type="button"
                className="text-industrial-500 hover:bg-industrial-100 flex size-10 items-center justify-center rounded-full transition-colors"
                aria-label="Fechar modal"
              />
            }
          >
            <Icon name="close" className="text-[22px]" />
          </DialogClose>
        </div>

        {/* Form */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* Nome */}
          <div className="space-y-1">
            <label htmlFor="loc-name" className="text-industrial-500 text-sm font-medium">
              Nome do Local
            </label>
            <input
              id="loc-name"
              type="text"
              value={form.name}
              onChange={(e) => patchForm({ name: e.target.value })}
              placeholder="Ex: 3º Pavimento, Sala Técnica..."
              className="border-industrial-200 text-industrial-900 placeholder:text-industrial-400 focus:border-safety-blue focus:ring-safety-blue h-12 w-full rounded-lg border bg-white px-4 text-base transition-all outline-none focus:ring-1"
            />
            {nameError && form.name !== '' && <p className="text-xs text-red-600">{nameError}</p>}
          </div>

          {/* Tipo */}
          <div className="space-y-1">
            <label htmlFor="loc-type" className="text-industrial-500 text-sm font-medium">
              Tipo de Local
            </label>
            <div className="relative">
              <select
                id="loc-type"
                value={form.type}
                onChange={(e) => patchForm({ type: e.target.value as Location['type'] })}
                className="border-industrial-200 text-industrial-900 focus:border-safety-blue focus:ring-safety-blue h-12 w-full appearance-none rounded-lg border bg-white px-4 pr-10 text-base transition-all outline-none focus:ring-1"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <Icon name="expand_more" className="text-industrial-400" />
              </div>
            </div>
          </div>

          {/* Delete section — edit mode only */}
          {isEditMode && (
            <div className="pt-2">
              <hr className="border-industrial-100 mb-4" />
              {showDeleteConfirm ? (
                <div className="space-y-3">
                  <p className="text-industrial-900 text-sm font-medium">
                    Excluir esta localização? Os itens vinculados ficarão sem localização.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="touch"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="border-industrial-200 text-industrial-700 flex-1"
                    >
                      Não, cancelar
                    </Button>
                    <Button
                      type="button"
                      size="touch"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 bg-red-600 text-white hover:bg-red-700"
                    >
                      {isDeleting ? <Loader2Icon className="mr-2 animate-spin size-4" /> : null}
                      Sim, excluir
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="touch"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Icon name="delete" className="text-[18px]" />
                  Excluir Localização
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer — CTAs touch (h-12), full-width no mobile */}
        <div className="border-industrial-200 bg-industrial-50 flex shrink-0 flex-col-reverse gap-3 border-t px-6 py-4 sm:flex-row sm:justify-end">
          <DialogClose
            render={
              <Button
                variant="outline"
                size="touch"
                className="border-industrial-200 text-industrial-700 w-full sm:w-auto"
                disabled={isSaving}
              />
            }
          >
            Cancelar
          </DialogClose>
          <Button
            size="touch"
            onClick={handleSave}
            disabled={isSaving || !!nameError}
            className="bg-industrial-900 hover:bg-industrial-800 w-full text-white sm:w-auto"
          >
            {isSaving ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <Icon name="save" className="mr-2 text-[20px]" />
            )}
            {primaryLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
