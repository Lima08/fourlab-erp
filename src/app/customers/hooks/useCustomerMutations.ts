import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerKeys } from '@/app/customers/hooks/customerKeys'
import {
  createCustomer,
  setCustomerActive,
  updateCustomer,
  type CustomerWriteInput,
} from '@/shared/services/customerService'

export function useCustomerMutations() {
  const queryClient = useQueryClient()

  const invalidateCustomers = () => {
    queryClient.invalidateQueries({ queryKey: customerKeys.all })
  }

  const createMutation = useMutation({
    mutationFn: (input: CustomerWriteInput) => createCustomer(input),
    onSuccess: () => {
      invalidateCustomers()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerWriteInput }) =>
      updateCustomer(id, input),
    onSuccess: () => {
      invalidateCustomers()
    },
  })

  const setActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setCustomerActive(id, isActive),
    onSuccess: () => {
      invalidateCustomers()
    },
  })

  return {
    createCustomer: createMutation,
    updateCustomer: updateMutation,
    setCustomerActive: setActiveMutation,
  }
}
