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

  const invalidateCustomer = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    if (id) {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) })
    }
  }

  const createMutation = useMutation({
    mutationFn: (input: CustomerWriteInput) => createCustomer(input),
    onSuccess: (customer) => {
      invalidateCustomer(customer.id)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerWriteInput }) =>
      updateCustomer(id, input),
    onSuccess: (customer) => {
      invalidateCustomer(customer.id)
    },
  })

  const setActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setCustomerActive(id, isActive),
    onSuccess: (_data, variables) => {
      invalidateCustomer(variables.id)
    },
  })

  return {
    createCustomer: createMutation,
    updateCustomer: updateMutation,
    setCustomerActive: setActiveMutation,
  }
}
