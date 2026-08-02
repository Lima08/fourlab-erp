import z from 'zod'

const PHONE_REGEX = /^\(?\d{2}\)?[\s-]?9?\d{4}-?\d{4}$/

export const clientSchema = z.object({
  name: z.string().min(1, 'Nome do cliente obrigatório'),
  phone: z
    .string()
    .min(1, 'Telefone do cliente obrigatório')
    .regex(PHONE_REGEX, 'Telefone inválido. Informe um número fixo ou celular com DDD.'),
})

export type ClientFormValues = z.infer<typeof clientSchema>
