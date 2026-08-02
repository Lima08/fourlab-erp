import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePostalCode } from './usePostalCode'
import { fetchAddressByCep } from '@/shared/utils/fetchAddressByCep'

vi.mock('@/shared/utils/fetchAddressByCep', () => ({
  fetchAddressByCep: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('usePostalCode', () => {
  it('delega busca de CEP para fetchAddressByCep', async () => {
    vi.mocked(fetchAddressByCep).mockResolvedValue({
      street: 'Av. Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    })

    const { result } = renderHook(() => usePostalCode())

    const address = await result.current.lookupPostalCode('01310-100')

    expect(fetchAddressByCep).toHaveBeenCalledWith('01310-100')
    expect(address).toMatchObject({ city: 'São Paulo' })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })
})
