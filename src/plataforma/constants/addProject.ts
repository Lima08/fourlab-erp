import type { ProjectDocumentType } from '@/plataforma/services/projectService'
import { projectFormSchema, type ProjectFormValues } from '../schemas/projectFormSchema'

export const INPUT_CLS =
  'h-12 w-full rounded-lg border border-industrial-200 bg-white px-4 text-base text-industrial-900 outline-none transition-all placeholder:text-industrial-400 focus:border-safety-blue focus:ring-1 focus:ring-safety-blue'
export const LABEL_CLS = 'text-xs font-semibold uppercase tracking-widest text-industrial-500'

export const UF_OPTIONS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export const UPLOAD_TYPE_OPTIONS: {
  id: ProjectDocumentType
  icon: string
  title: string
  subtitle: string
}[] = [
  { id: 'PT_APPROVED', icon: 'home', title: 'PT Aprovado', subtitle: 'Edificações ≥ 750m²' },
  { id: 'IPTU', icon: 'apartment', title: 'IPTU', subtitle: 'Edificações < 750m²' },
]

export const STEPS: { id: 1 | 2 | 3 | 4; label: string }[] = [
  { id: 1, label: 'Adicionar cliente' },
  { id: 2, label: 'Dados do projeto' },
  { id: 3, label: 'Endereço do imóvel' },
  { id: 4, label: 'Base da vistoria' },
]

export const step1Schema = projectFormSchema.pick({
  name: true,
  description: true,
  total_area: true,
  responsible_client: true,
})

export const step2Schema = projectFormSchema.pick({
  postal_code: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
})

export const INITIAL_VALUES: ProjectFormValues = {
  name: '',
  description: '',
  postal_code: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  total_area: 0,
  responsible_client: '',
}
