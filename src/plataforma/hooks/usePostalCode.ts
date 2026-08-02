import { fetchAddressByCep } from '@/shared/utils/fetchAddressByCep'
import { useState } from 'react'

export function usePostalCode() {
  const [error, setError] = useState<string | null>(null)

  const search = async (postalCode: string) => {
    if (!postalCode.trim()) {
      return {
        street: '',
        neighborhood: '',
        city: '',
        state: '',
      }
    }

    try {
      setError(null)
      return await fetchAddressByCep(postalCode)
    } catch {
      setError('Não foi possível buscar o CEP.')
      return null
    }
  }

  return {
    search,
    error,
  }
}
