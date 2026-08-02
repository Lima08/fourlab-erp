import z from 'zod'

export const projectFormSchema = z.object({
  name: z.string().min(1, 'Nome do projeto obrigatório'),
  description: z.string().min(1, 'Descrição do projeto obrigatório'),
  postal_code: z.string().min(1, 'CEP obrigatório'),
  street: z.string().min(1, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string(),
  neighborhood: z.string().min(1, 'Bairro obrigatório'),
  city: z.string().min(1, 'Cidade obrigatória'),
  state: z.string().min(1, 'Estado obrigatório'),
  total_area: z.coerce.number().positive('Área total deve ser maior que zero'),
  responsible_client: z.string().min(1, 'Cliente responsável obrigatório'),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>
