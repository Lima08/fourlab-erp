export type ProfileRole = 'cliente' | 'admin'
export type ProfileStatus = 'ativo' | 'convite_pendente' | 'suspenso'

export interface Profile {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: ProfileRole
  status: ProfileStatus
  createdAt: string
  updatedAt: string
}
