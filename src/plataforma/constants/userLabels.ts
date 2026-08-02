import type { ProfileCounts, ProfileFilter } from '@/shared/services/profileAdminService'
import type { ProfileRole, ProfileStatus } from '@/shared/types/profile'

export const ROLE_LABELS: Record<ProfileRole, string> = {
  admin: 'Administrador',
  cliente: 'Cliente',
}

export const STATUS_LABELS: Record<ProfileStatus, string> = {
  ativo: 'Ativo',
  convite_pendente: 'Convite pendente',
  suspenso: 'Suspenso',
}

export const FILTER_PILLS: {
  id: ProfileFilter
  label: string
  icon: string
  countKey: keyof ProfileCounts
}[] = [
  { id: 'all', label: 'Todos', icon: 'person', countKey: 'all' },
  { id: 'ativo', label: 'Ativos', icon: 'check_circle', countKey: 'ativo' },
  {
    id: 'convite_pendente',
    label: 'Convite pendente',
    icon: 'schedule',
    countKey: 'convite_pendente',
  },
  { id: 'suspenso', label: 'Suspensos', icon: 'block', countKey: 'suspenso' },
  { id: 'admin', label: 'Administradores', icon: 'admin_panel_settings', countKey: 'admin' },
]
