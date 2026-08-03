import { supabase } from '@/shared/db/supabase'
import { getInviteRedirectTo } from '@/shared/navigation/getAuthHomePath'

export interface InviteUserPayload {
  fullName: string
  email: string
  phone: string
}

export interface UpdateUserPayload {
  userId: string
  fullName: string
  email: string
  phone: string
}

export type EdgeResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

interface EdgeErrorBody {
  error?: string
  code?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_EXISTS: 'E-mail já cadastrado',
  NOT_AUTHORIZED: 'Sem permissão',
  NOT_FOUND: 'Usuário não encontrado',
  INVALID_STATUS: 'Convite não pendente',
  VALIDATION_ERROR: 'Dados inválidos',
}

export function mapEdgeErrorMessage(code?: string, fallback?: string): string {
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code]
  }
  return fallback ?? 'Operação falhou. Tente novamente.'
}

function parseEdgeErrorBody(data: unknown): EdgeErrorBody | null {
  if (!data || typeof data !== 'object') return null
  const body = data as EdgeErrorBody
  if (body.error || body.code) return body
  return null
}

async function invokeEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<EdgeResult<T>> {
  const { data, error } = await supabase.functions.invoke(functionName, { body })

  if (error) {
    let code: string | undefined
    let message: string | undefined

    const dataBody = parseEdgeErrorBody(data)
    if (dataBody) {
      code = dataBody.code
      message = dataBody.error
    }

    const context = (error as { context?: Response }).context
    if (context && typeof context.json === 'function') {
      try {
        const responseBody = (await context.json()) as EdgeErrorBody
        code = responseBody.code ?? code
        message = responseBody.error ?? message
      } catch {
        // response body may already be consumed or invalid
      }
    }

    return {
      success: false,
      error: mapEdgeErrorMessage(code, message ?? error.message),
      code,
    }
  }

  const errorBody = parseEdgeErrorBody(data)
  if (errorBody?.error) {
    return {
      success: false,
      error: mapEdgeErrorMessage(errorBody.code, errorBody.error),
      code: errorBody.code,
    }
  }

  return { success: true, data: data as T }
}

function getPasswordSetupRedirectTo(): string {
  return getInviteRedirectTo()
}

export async function inviteUser(payload: InviteUserPayload): Promise<EdgeResult<{ id: string }>> {
  return invokeEdgeFunction('invite-user', {
    mode: 'create',
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    redirectTo: getPasswordSetupRedirectTo(),
  })
}

export async function resendInvite(userId: string): Promise<EdgeResult<void>> {
  const result = await invokeEdgeFunction<{ ok?: boolean }>('invite-user', {
    mode: 'resend',
    userId,
    redirectTo: getPasswordSetupRedirectTo(),
  })

  if (result.success) {
    return { success: true, data: undefined }
  }

  return result
}

export async function updateUser(payload: UpdateUserPayload): Promise<EdgeResult<void>> {
  const result = await invokeEdgeFunction<{ ok?: boolean }>('update-user', {
    userId: payload.userId,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
  })

  if (result.success) {
    return { success: true, data: undefined }
  }

  return result
}
