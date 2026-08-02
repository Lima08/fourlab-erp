import type { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'
import { EdgeError } from './errors.ts'

/** Requires a valid JWT and an active profile — no RBAC; any active user may call admin edge functions. */
export async function assertAdmin(req: Request, adminClient: SupabaseClient): Promise<User> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new EdgeError('NOT_AUTHORIZED', 403, 'Sem permissão')
  }

  const token = authHeader.slice('Bearer '.length)
  const {
    data: { user },
    error,
  } = await adminClient.auth.getUser(token)

  if (error || !user) {
    throw new EdgeError('NOT_AUTHORIZED', 403, 'Sem permissão')
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.is_active) {
    throw new EdgeError('NOT_AUTHORIZED', 403, 'Sem permissão')
  }

  return user
}
