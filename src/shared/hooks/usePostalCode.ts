import { useState } from 'react'
import { fetchAddressByCep, type AddressByCep } from '@/shared/utils/fetchAddressByCep'

export function usePostalCode() {
  const [isLoading, setIsLoading] = useState(false)

  async function lookupPostalCode(cep: string): Promise<AddressByCep | null> {
    setIsLoading(true)
    try {
      return await fetchAddressByCep(cep)
    } finally {
      setIsLoading(false)
    }
  }

  return { lookupPostalCode, isLoading }
}
