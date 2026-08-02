import { useState } from 'react'
import { toast } from 'sonner'
import { db } from '@/shared/db/dexie'
import type { Location } from '@/shared/db/dexie'
import {
  enqueueLocationAdd,
  enqueueLocationDelete,
  enqueueLocationUpdate,
} from '@/shared/services/sync/queueProcessor'

export interface LocationEditForm {
  name: string
  type: Location['type']
}

export interface UseLocationEditResult {
  form: LocationEditForm
  patchForm: (patch: Partial<LocationEditForm>) => void
  nameError: string | null
  isSaving: boolean
  isDeleting: boolean
  showDeleteConfirm: boolean
  setShowDeleteConfirm: (v: boolean) => void
  handleSave: () => Promise<void>
  handleDelete: () => Promise<void>
}

interface UseLocationEditOptions {
  /** undefined = mode create; string = mode edit */
  locationId: string | undefined
  projectId: string
  initialName?: string
  initialType?: Location['type']
  onClose: () => void
  /** Called after a successful create, before onClose */
  onCreated?: (location: Location) => void
}

export function useLocationEdit({
  locationId,
  projectId,
  initialName = '',
  initialType = 'floor',
  onClose,
  onCreated,
}: UseLocationEditOptions): UseLocationEditResult {
  const [form, setForm] = useState<LocationEditForm>({
    name: initialName,
    type: initialType,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const patchForm = (patch: Partial<LocationEditForm>) => setForm((prev) => ({ ...prev, ...patch }))

  const nameError = form.name.trim() === '' ? 'Nome é obrigatório' : null

  const handleSave = async () => {
    if (nameError) return
    setIsSaving(true)
    try {
      if (locationId === undefined) {
        const newLocation: Location = {
          id: crypto.randomUUID(),
          projectId,
          name: form.name.trim(),
          type: form.type,
          deletedAt: null,
          updatedAt: new Date(),
        }
        await db.locations.add(newLocation)
        await enqueueLocationAdd(newLocation)
        onCreated?.(newLocation)
      } else {
        const updatedLocation: Location = {
          id: locationId,
          projectId,
          name: form.name.trim(),
          type: form.type,
          deletedAt: null,
          updatedAt: new Date(),
        }
        await db.locations.update(locationId, {
          name: updatedLocation.name,
          type: updatedLocation.type,
        })
        await enqueueLocationUpdate(updatedLocation)
      }
      onClose()
    } catch {
      toast.error('Falha ao salvar localização — tente novamente')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!locationId) return
    setIsDeleting(true)
    try {
      await db.items.where('locationId').equals(locationId).modify({ locationId: null })
      await db.locations.delete(locationId)
      await enqueueLocationDelete(locationId)
      onClose()
    } catch {
      toast.error('Falha ao excluir localização — tente novamente')
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    form,
    patchForm,
    nameError,
    isSaving,
    isDeleting,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleSave,
    handleDelete,
  }
}
