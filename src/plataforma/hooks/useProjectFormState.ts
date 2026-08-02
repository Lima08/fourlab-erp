import { useState } from 'react'
import { type ProjectFormValues } from '@/plataforma/schemas/projectFormSchema'
import { useCreateProject } from '@/plataforma/hooks/useCreateProject'
import { useClientFormState } from '@/plataforma/hooks/useClientFormState'
import { useProjectValidation } from '@/plataforma/hooks/useProjectValidation'
import { useAuthStore } from '@/shared/stores/authStore'
import type { ProjectDocumentType } from '@/plataforma/services/projectService'
import { INITIAL_VALUES, step1Schema, step2Schema } from '@/plataforma/constants/addProject'

interface Options {
  onOpenChange: (open: boolean) => void
}

export function useProjectFormState({ onOpenChange }: Options) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [values, setValues] = useState<ProjectFormValues>(INITIAL_VALUES)
  const [uploadType, setUploadType] = useState<ProjectDocumentType | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const { create, isCreating } = useCreateProject()
  const {
    clientValues,
    clientFieldErrors,
    isCreatingClient,
    patchClientValues,
    resetClientForm,
    submitClient,
  } = useClientFormState()
  const user = useAuthStore((s) => s.user)
  const { fieldErrors, validateStep, clearErrors } = useProjectValidation(values)

  const resetForm = () => {
    setStep(1)
    setValues(INITIAL_VALUES)
    resetClientForm()
    clearErrors()
    setUploadType(null)
    setFile(null)
  }

  const handleClose = () => {
    if (isCreating) return
    resetForm()
    onOpenChange(false)
  }

  const patchValues = (patch: Partial<ProjectFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }))
    clearErrors()
  }

  const handleContinueClientStep = (event: React.FormEvent) => {
    event.preventDefault()
    setStep(2)
  }

  const handleCreateClient = async () => {
    try {
      const client = await submitClient()
      if (!client) return
      patchValues({ responsible_client: client.id })
      setStep(2)
    } catch {
      // toast tratado no hook de mutação
    }
  }

  const handleContinueStep1 = (event: React.FormEvent) => {
    event.preventDefault()
    if (validateStep(step1Schema)) setStep(3)
  }

  const handleContinueStep2 = (event: React.FormEvent) => {
    event.preventDefault()
    if (validateStep(step2Schema)) setStep(4)
  }

  const handleBack = () => setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev))

  const addFile = (newFiles: File[]) => {
    const pdf = newFiles.find((f) => f.type === 'application/pdf')
    if (pdf) setFile(pdf)
  }

  const removeFile = () => {
    setFile(null)
  }

  const handleFinish = async () => {
    if (!uploadType || !file || !user) return

    try {
      await create({
        ...values,
        documentType: uploadType,
        documentFile: file,
        responsibleProfileId: user.id,
      })
      resetForm()
      onOpenChange(false)
    } catch {
      // toast tratado no hook de mutação
    }
  }

  const canFinish = uploadType !== null && file !== null && !isCreating

  return {
    step,
    values,
    fieldErrors,
    clientValues,
    clientFieldErrors,
    isCreatingClient,
    uploadType,
    file,
    isCreating,
    canFinish,
    setUploadType,
    patchValues,
    patchClientValues,
    handleClose,
    handleContinueClientStep,
    handleCreateClient,
    handleContinueStep1,
    handleContinueStep2,
    handleBack,
    addFile,
    removeFile,
    handleFinish,
  }
}
