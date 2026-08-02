import { useState } from 'react'
import type { ProjectFormValues } from '@/plataforma/schemas/projectFormSchema'
import type { step1Schema, step2Schema } from '@/plataforma/constants/addProject'

type ProjectStepSchema = typeof step1Schema | typeof step2Schema
type FieldErrors = Partial<Record<keyof ProjectFormValues, string>>

export function useProjectValidation(values: ProjectFormValues) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const clearErrors = () => setFieldErrors({})

  const validateStep = (schema: ProjectStepSchema) => {
    const result = schema.safeParse(values)
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !errors[field as keyof ProjectFormValues]) {
          errors[field as keyof ProjectFormValues] = issue.message
        }
      }
      setFieldErrors(errors)
      return false
    }
    clearErrors()
    return true
  }

  return {
    fieldErrors,
    validateStep,
    clearErrors,
  }
}
