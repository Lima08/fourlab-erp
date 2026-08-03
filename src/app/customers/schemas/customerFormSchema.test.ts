import { describe, it, expect } from 'vitest'
import { customerFormSchema } from './customerFormSchema'

describe('customerFormSchema', () => {
  it('aceita cadastro mínimo PF', () => {
    const result = customerFormSchema.safeParse({
      customerType: 'pf',
      fullName: 'Ana Silva',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fullName).toBe('Ana Silva')
      expect(result.data.tradeName).toBeUndefined()
    }
  })

  it('aceita cadastro PJ com nome fantasia', () => {
    const result = customerFormSchema.safeParse({
      customerType: 'pj',
      fullName: 'Fourlab Ltda',
      tradeName: 'Fourlab',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tradeName).toBe('Fourlab')
    }
  })

  it('rejeita nome vazio', () => {
    const result = customerFormSchema.safeParse({
      customerType: 'pf',
      fullName: '   ',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Nome é obrigatório')
    }
  })

  it('rejeita documento inválido para PF', () => {
    const result = customerFormSchema.safeParse({
      customerType: 'pf',
      fullName: 'Ana Silva',
      document: '111.111.111-11',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('document'))).toBe(true)
    }
  })

  it('aceita CPF válido e normaliza dígitos', () => {
    const result = customerFormSchema.safeParse({
      customerType: 'pf',
      fullName: 'Ana Silva',
      document: '529.982.247-25',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.document).toBe('52998224725')
    }
  })

  it('rejeita e-mail inválido', () => {
    const result = customerFormSchema.safeParse({
      customerType: 'pf',
      fullName: 'Ana Silva',
      email: 'email-invalido',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('E-mail inválido')
    }
  })

  it('rejeita nome fantasia em PF', () => {
    const result = customerFormSchema.safeParse({
      customerType: 'pf',
      fullName: 'Ana Silva',
      tradeName: 'Fantasia',
    })

    expect(result.success).toBe(false)
  })
})
