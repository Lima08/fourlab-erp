import { useState } from 'react'
import type { Client } from '@/shared/services/clientService'
import { useCreateClient } from './useCreateClient'
import { clientSchema, type ClientFormValues } from '../schemas/clientFormSchema'
import { INITIAL_CLIENT_VALUES } from '../constants/addClient'

type ClientFieldErrors = Partial<Record<keyof ClientFormValues, string>>

export function useClientFormState() {
  const [clientValues, setClientValues] = useState<ClientFormValues>(INITIAL_CLIENT_VALUES)
  const [clientFieldErrors, setClientFieldErrors] = useState<ClientFieldErrors>({})
  const { create, isCreating: isCreatingClient } = useCreateClient()

  const resetClientForm = () => {
    setClientValues(INITIAL_CLIENT_VALUES)
    setClientFieldErrors({})
  }

  const patchClientValues = (patch: Partial<ClientFormValues>) => {
    setClientValues((prev) => ({ ...prev, ...patch }))
    setClientFieldErrors({})
  }

  const submitClient = async (): Promise<Client | null> => {
    const result = clientSchema.safeParse(clientValues)
    if (!result.success) {
      const errors: ClientFieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !errors[field as keyof ClientFormValues]) {
          errors[field as keyof ClientFormValues] = issue.message
        }
      }
      setClientFieldErrors(errors)
      return null
    }

    const client = await create(result.data)
    resetClientForm()
    return client
  }

  return {
    clientValues,
    clientFieldErrors,
    isCreatingClient,
    patchClientValues,
    resetClientForm,
    submitClient,
  }
}
