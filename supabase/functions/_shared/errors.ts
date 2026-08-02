import { jsonResponse } from './cors.ts'

export class EdgeError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'EdgeError'
  }
}

export function handleEdgeError(error: unknown): Response {
  if (error instanceof EdgeError) {
    return jsonResponse({ error: error.message, code: error.code }, error.status)
  }

  console.error(error)
  return jsonResponse({ error: 'Erro interno do servidor', code: 'INTERNAL' }, 500)
}
