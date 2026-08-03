import { z } from 'npm:zod@3.24.1'
import { assertAdmin } from '../_shared/assertAdmin.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { EdgeError, handleEdgeError } from '../_shared/errors.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

const createSchema = z.object({
  mode: z.literal('create'),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  redirectTo: z.string().url().optional(),
})

const resendSchema = z.object({
  mode: z.literal('resend'),
  userId: z.string().uuid(),
  redirectTo: z.string().url().optional(),
})

function parseInviteBody(rawBody: unknown) {
  if (typeof rawBody === 'object' && rawBody !== null && (rawBody as { mode?: string }).mode === 'resend') {
    return resendSchema.safeParse(rawBody)
  }

  return createSchema.safeParse(rawBody)
}

function resolveInviteRedirectTo(req: Request, redirectTo?: string): string | undefined {
  if (redirectTo) {
    return redirectTo
  }

  const siteUrl = Deno.env.get('SITE_URL')
  if (siteUrl) {
    return `${siteUrl.replace(/\/$/, '')}/ativar-conta`
  }

  const origin = req.headers.get('Origin')
  if (origin) {
    return `${origin.replace(/\/$/, '')}/ativar-conta`
  }

  return undefined
}

async function handleCreate(
  adminClient: ReturnType<typeof createSupabaseAdmin>,
  body: z.infer<typeof createSchema>,
  redirectTo: string | undefined
) {
  const email = body.email.trim().toLowerCase()

  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    throw new EdgeError('EMAIL_EXISTS', 409, 'E-mail já cadastrado')
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        full_name: body.fullName.trim(),
        phone: body.phone,
      },
      redirectTo,
    }
  )

  if (inviteError) {
    const message = inviteError.message.toLowerCase()
    if (
      message.includes('already') ||
      message.includes('registered') ||
      message.includes('exists')
    ) {
      throw new EdgeError('EMAIL_EXISTS', 409, 'E-mail já cadastrado')
    }
    throw inviteError
  }

  const userId = inviteData.user?.id
  if (!userId) {
    throw new EdgeError('INTERNAL', 500, 'Erro interno do servidor')
  }

  const now = new Date().toISOString()
  const { error: insertError } = await adminClient.from('profiles').insert({
    id: userId,
    full_name: body.fullName.trim(),
    email,
    phone: body.phone,
    is_active: false,
    activated_at: null,
    created_at: now,
    updated_at: now,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      throw new EdgeError('EMAIL_EXISTS', 409, 'E-mail já cadastrado')
    }
    throw insertError
  }

  return jsonResponse({ id: userId })
}

async function handleResend(
  adminClient: ReturnType<typeof createSupabaseAdmin>,
  body: z.infer<typeof resendSchema>,
  redirectTo: string | undefined
) {
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('email, is_active, activated_at')
    .eq('id', body.userId)
    .maybeSingle()

  if (profileError) throw profileError

  if (!profile) {
    throw new EdgeError('NOT_FOUND', 404, 'Usuário não encontrado')
  }

  if (profile.activated_at !== null) {
    throw new EdgeError('INVALID_STATUS', 400, 'Convite não pendente')
  }

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(profile.email, {
    redirectTo,
  })

  if (inviteError) {
    throw inviteError
  }

  return jsonResponse({ ok: true })
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405)
  }

  try {
    const adminClient = createSupabaseAdmin()
    await assertAdmin(req, adminClient)

    const rawBody = await req.json()
    const parsed = parseInviteBody(rawBody)

    if (!parsed.success) {
      throw new EdgeError('VALIDATION_ERROR', 400, 'Dados inválidos')
    }

    const redirectTo = resolveInviteRedirectTo(req, parsed.data.redirectTo)

    if (parsed.data.mode === 'create') {
      return await handleCreate(adminClient, parsed.data, redirectTo)
    }

    return await handleResend(adminClient, parsed.data, redirectTo)
  } catch (error) {
    return handleEdgeError(error)
  }
})
