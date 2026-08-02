import { toast } from 'sonner'

const VIA_CEP_URL = import.meta.env.VITE_VIA_CEP_URL as string

export interface AddressByCep {
  street: string
  neighborhood: string
  city: string
  state: string
}

export async function fetchAddressByCep(cep: string): Promise<AddressByCep | null> {
  const cleanCep = cep.replace(/\D/g, '')

  if (cleanCep.length !== 8) {
    toast.warning('CEP deve conter oito dígitos. ')
    return null
  }

  try {
    const response = await fetch(`${VIA_CEP_URL}/${cleanCep}/json/`)
    const data = await response.json()

    if (data.erro) return null

    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    }
  } catch {
    toast.error('Erro ao buscar CEP. Por favor, adicione as informações manualmente.')
    return null
  }
}
