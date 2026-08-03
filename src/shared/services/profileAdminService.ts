import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/shared/db/supabase'
import type { Profile } from '@/shared/types/profile'

export type ProfileFilter = 'all' | 'active' | 'inactive'

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
  active: number
  inactive: number
}

export interface ProfileUpdateFields {
  fullName?: string
  email?: string
  phone?: string | null
}

export interface ProfileFilterConditions {
  isActive?: boolean
}

interface ProfileRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  is_active: boolean
  activated_at: string | null
  created_at: string
  updated_at: string
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    isActive: row.is_active,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function buildProfileFilter(filter: ProfileFilter): ProfileFilterConditions {
  switch (filter) {
    case 'active':
      return { isActive: true }
    case 'inactive':
      return { isActive: false }
    case 'all':
    default:
      return {}
  }
}

export async function fetchProfileCounts(): Promise<ProfileCounts> {
  const [allResult, activeResult, inactiveResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
  ])

  if (allResult.error) throw allResult.error
  if (activeResult.error) throw activeResult.error
  if (inactiveResult.error) throw inactiveResult.error

  return {
    all: allResult.count ?? 0,
    active: activeResult.count ?? 0,
    inactive: inactiveResult.count ?? 0,
  }
}

export async function fetchProfileList(params: ProfileListParams): Promise<ProfileListResult> {
  const { filter, search, page, pageSize } = params

  let query = supabase.from('profiles').select('*', { count: 'exact' })

  const filterConditions = buildProfileFilter(filter)
  if (filterConditions.isActive !== undefined) {
    query = query.eq('is_active', filterConditions.isActive)
  }

  if (search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`)
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

export async function updateProfileActiveStatus(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function updateProfileFields(id: string, fields: ProfileUpdateFields): Promise<void> {
  const update: {
    full_name?: string
    email?: string
    phone?: string | null
    updated_at: string
  } = { updated_at: new Date().toISOString() }

  if (fields.fullName !== undefined) update.full_name = fields.fullName
  if (fields.email !== undefined) update.email = fields.email
  if (fields.phone !== undefined) update.phone = fields.phone

  const { error } = await supabase.from('profiles').update(update).eq('id', id)

  if (error) throw error
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id)

  if (error) throw error
}

export function mapProfileError(error: PostgrestError): string {
  void error
  return 'Operação falhou. Tente novamente.'
}
