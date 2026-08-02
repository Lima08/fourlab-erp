import { describe, it, expect } from 'vitest'
import { userFormSchema, userInviteFormSchema } from './userFormSchema'

const validPayload = {
  fullName: 'Maria Silva',
  email: 'maria@exemplo.com',
  phone: '(11) 98765-4321',
  role: 'admin' as const,
}

const validClientePayload = {
  ...validPayload,
  role: 'cliente' as const,
  clientId: '11111111-1111-4111-8111-111111111111',
}

describe('userFormSchema', () => {
  it('aceita dados válidos', () => {
    const result = userFormSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('rejeita nome curto', () => {
    const result = userFormSchema.safeParse({ ...validPayload, fullName: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Nome obrigatório')
    }
  })

  it('rejeita e-mail inválido', () => {
    const result = userFormSchema.safeParse({ ...validPayload, email: 'invalido' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('E-mail inválido')
    }
  })

  it('rejeita telefone inválido', () => {
    const result = userFormSchema.safeParse({ ...validPayload, phone: '(11) 1234' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Telefone inválido')
    }
  })

  it('rejeita role inválida', () => {
    const result = userFormSchema.safeParse({ ...validPayload, role: 'inspetor' })
    expect(result.success).toBe(false)
  })

  it('aceita telefone fixo válido', () => {
    const result = userFormSchema.safeParse({ ...validPayload, phone: '(11) 3456-7890' })
    expect(result.success).toBe(true)
  })
})

describe('userInviteFormSchema', () => {
  it('exige clientId quando role é cliente', () => {
    const result = userInviteFormSchema.safeParse({
      ...validPayload,
      role: 'cliente',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === 'Selecione um cliente')).toBe(
        true
      )
    }
  })

  it('aceita convite de cliente com clientId', () => {
    const result = userInviteFormSchema.safeParse(validClientePayload)
    expect(result.success).toBe(true)
  })

  it('não exige clientId quando role é admin', () => {
    const result = userInviteFormSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })
})
