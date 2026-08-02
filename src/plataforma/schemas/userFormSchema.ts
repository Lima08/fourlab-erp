import { z } from 'zod'
import { isValidBrPhone } from '@/shared/utils/phoneMask'

export const userFormBaseSchema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().refine(isValidBrPhone, 'Telefone inválido'),
  role: z.enum(['cliente', 'admin']),
  clientId: z.string().uuid().optional(),
})

export const userFormSchema = userFormBaseSchema

export const userInviteFormSchema = userFormBaseSchema.superRefine((data, ctx) => {
  if (data.role === 'cliente' && !data.clientId) {
    ctx.addIssue({
      code: 'custom',
      message: 'Selecione um cliente',
      path: ['clientId'],
    })
  }
})

export type UserFormValues = z.infer<typeof userFormBaseSchema>
