import { z } from 'npm:zod@3.24.1'
import { assertAdmin } from '../_shared/assertAdmin.ts'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { EdgeError, handleEdgeError } from '../_shared/errors.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
})

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
    const parsed = updateUserSchema.safeParse(rawBody)

    if (!parsed.success) {
      throw new EdgeError('VALIDATION_ERROR', 400, 'Dados inválidos')
    }

    const { userId, fullName, email, phone } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()

    const { data: existingProfile, error: fetchError } = await adminClient
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (!existingProfile) {
      throw new EdgeError('NOT_FOUND', 404, 'Usuário não encontrado')
    }

    if (existingProfile.email.toLowerCase() !== normalizedEmail) {
      const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
        email: normalizedEmail,
      })

      if (authError) {
        const message = authError.message.toLowerCase()
        if (
          message.includes('already') ||
          message.includes('registered') ||
          message.includes('exists')
        ) {
          throw new EdgeError('EMAIL_EXISTS', 409, 'E-mail já cadastrado')
        }
        throw authError
      }
    }

    const now = new Date().toISOString()
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        email: normalizedEmail,
        phone,
        updated_at: now,
      })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    return jsonResponse({ ok: true })
  } catch (error) {
    return handleEdgeError(error)
  }
})
