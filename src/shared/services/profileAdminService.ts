import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/shared/db/supabase'
import type { Profile, ProfileRole, ProfileStatus } from '@/shared/types/profile'

export type ProfileFilter = 'all' | 'ativo' | 'convite_pendente' | 'suspenso' | 'admin'

export interface ProfileListParams {
  filter: ProfileFilter
  search: string
  page: number
  pageSize: number
}

export interface ProfileListResult {
  profiles: Profile[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ProfileCounts {
  all: number
  ativo: number
  convite_pendente: number
  suspenso: number
  admin: number
}

export interface ProfileUpdateFields {
  fullName?: string
  email?: string
  phone?: string | null
  role?: ProfileRole
}

export interface ProfileFilterConditions {
  status?: ProfileStatus
  role?: ProfileRole
}

interface ProfileRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: ProfileRole
  status: ProfileStatus
  created_at: string
  updated_at: string
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function buildProfileFilter(filter: ProfileFilter): ProfileFilterConditions {
  switch (filter) {
    case 'ativo':
      return { status: 'ativo' }
    case 'convite_pendente':
      return { status: 'convite_pendente' }
    case 'suspenso':
      return { status: 'suspenso' }
    case 'admin':
      return { role: 'admin' }
    case 'all':
    default:
      return {}
  }
}

export function mapSearchToRole(search: string): ProfileRole | null {
  const term = search.trim().toLowerCase()
  if (!term) return null
  if (term.includes('administrador') || term === 'admin') return 'admin'
  if (term.includes('cliente') || term === 'client') return 'cliente'
  return null
}

export async function fetchProfileCounts(): Promise<ProfileCounts> {
  const { data, error } = await supabase.rpc('get_profile_counts')

  if (error) throw error

  const counts = data as Record<string, number> | null

  return {
    all: counts?.all ?? 0,
    ativo: counts?.ativo ?? 0,
    convite_pendente: counts?.convite_pendente ?? 0,
    suspenso: counts?.suspenso ?? 0,
    admin: counts?.admin ?? 0,
  }
}

export async function fetchProfileList(params: ProfileListParams): Promise<ProfileListResult> {
  const { filter, search, page, pageSize } = params

  let query = supabase.from('profiles').select('*', { count: 'exact' })

  const filterConditions = buildProfileFilter(filter)
  if (filterConditions.status) {
    query = query.eq('status', filterConditions.status)
  }
  if (filterConditions.role) {
    query = query.eq('role', filterConditions.role)
  }

  if (search.trim()) {
    const term = `%${search.trim()}%`
    const roleTerm = mapSearchToRole(search)
    const orParts = [`full_name.ilike.${term}`, `email.ilike.${term}`]
    if (roleTerm) {
      orParts.push(`role.eq.${roleTerm}`)
    }
    query = query.or(orParts.join(','))
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query.order('full_name').range(from, to)

  if (error) throw error

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    profiles: (data ?? []).map((row) => toProfile(row as ProfileRow)),
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function updateProfileStatus(id: string, status: ProfileStatus): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function updateProfileFields(id: string, fields: ProfileUpdateFields): Promise<void> {
  const update: {
    full_name?: string
    email?: string
    phone?: string | null
    role?: ProfileRole
    updated_at: string
  } = { updated_at: new Date().toISOString() }

  if (fields.fullName !== undefined) update.full_name = fields.fullName
  if (fields.email !== undefined) update.email = fields.email
  if (fields.phone !== undefined) update.phone = fields.phone
  if (fields.role !== undefined) update.role = fields.role

  const { error } = await supabase.from('profiles').update(update).eq('id', id)

  if (error) throw error
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id)

  if (error) throw error
}

export function mapProfileError(error: PostgrestError): string {
  if (error.message?.includes('assert_not_last_admin')) {
    return 'Não é possível — este é o único administrador.'
  }
  return 'Operação falhou. Tente novamente.'
}
