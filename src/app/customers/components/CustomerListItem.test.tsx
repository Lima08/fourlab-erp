import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { CustomerListItem } from './CustomerListItem'
import type { Customer } from '@/shared/services/customerService'

const customer: Customer = {
  id: 'cust-1',
  customerType: 'pf',
  document: '52998224725',
  fullName: 'Ana Silva',
  tradeName: null,
  email: null,
  phone: null,
  zipCode: null,
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  city: null,
  state: null,
  instagram: null,
  facebook: null,
  linkedin: null,
  website: null,
  notes: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}

afterEach(() => {
  cleanup()
})

describe('CustomerListItem', () => {
  it('dispara callback ao selecionar cliente', () => {
    const onSelect = vi.fn()

    render(<CustomerListItem customer={customer} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /Ana Silva/i }))
    expect(onSelect).toHaveBeenCalledWith('cust-1')
  })
})
