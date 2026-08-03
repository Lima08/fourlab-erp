import { z } from 'zod'
import { isValidCnpj, isValidCpf, stripDigits } from '@/shared/utils/brazilianDocuments'

function optionalTrimmedString() {
  return z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === undefined || value === '' ? undefined : value))
}

function optionalDigitString() {
  return z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (value === undefined || value === '') return undefined
      return stripDigits(value) || undefined
    })
}

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === undefined || value === '' ? undefined : value))
  .refine((value) => value === undefined || z.string().url().safeParse(value).success, {
    message: 'URL inválida',
  })

export const customerFormSchema = z
  .object({
    customerType: z.enum(['pf', 'pj'], { message: 'Tipo de cliente é obrigatório' }),
    fullName: z.string().trim().min(1, 'Nome é obrigatório'),
    tradeName: optionalTrimmedString(),
    document: optionalDigitString(),
    email: optionalTrimmedString().refine(
      (value) => value === undefined || z.string().email().safeParse(value).success,
      { message: 'E-mail inválido' }
    ),
    phone: optionalDigitString(),
    zipCode: optionalDigitString(),
    street: optionalTrimmedString(),
    number: optionalTrimmedString(),
    complement: optionalTrimmedString(),
    neighborhood: optionalTrimmedString(),
    city: optionalTrimmedString(),
    state: z
      .string()
      .trim()
      .optional()
      .transform((value) => {
        if (value === undefined || value === '') return undefined
        return value.toUpperCase()
      }),
    instagram: optionalUrl,
    facebook: optionalUrl,
    linkedin: optionalUrl,
    website: optionalUrl,
    notes: optionalTrimmedString(),
  })
  .superRefine((data, ctx) => {
    if (data.customerType === 'pf' && data.tradeName) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nome fantasia não se aplica a pessoa física',
        path: ['tradeName'],
      })
    }

    if (!data.document) {
      return
    }

    const isValid =
      data.customerType === 'pf' ? isValidCpf(data.document) : isValidCnpj(data.document)

    if (!isValid) {
      ctx.addIssue({
        code: 'custom',
        message:
          data.customerType === 'pf'
            ? 'CPF inválido. Verifique os dígitos.'
            : 'CNPJ inválido. Verifique os dígitos.',
        path: ['document'],
      })
    }
  })

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export const emptyCustomerFormValues: CustomerFormValues = {
  customerType: 'pf',
  fullName: '',
  tradeName: undefined,
  document: undefined,
  email: undefined,
  phone: undefined,
  zipCode: undefined,
  street: undefined,
  number: undefined,
  complement: undefined,
  neighborhood: undefined,
  city: undefined,
  state: undefined,
  instagram: undefined,
  facebook: undefined,
  linkedin: undefined,
  website: undefined,
  notes: undefined,
}
