import { supabase } from '@/shared/db/supabase'
import type { Profile, ProfileRole, ProfileStatus } from '@/shared/types/profile'

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

export async function fetchOwnProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: row } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, status, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!row) return null

  return toProfile(row as ProfileRow)
}

export async function activateOwnProfile(): Promise<{ error?: string; activated: boolean }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado', activated: false }
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'ativo', updated_at: now })
    .eq('id', user.id)
    .eq('status', 'convite_pendente')
    .select('id')
    .maybeSingle()

  if (error) {
    return { error: error.message, activated: false }
  }

  return { activated: !!data }
}

export async function activatePendingInviteIfNeeded(): Promise<{
  error?: string
  activated: boolean
}> {
  const profile = await fetchOwnProfile()
  if (profile?.status !== 'convite_pendente') {
    return { activated: false }
  }

  return activateOwnProfile()
}
