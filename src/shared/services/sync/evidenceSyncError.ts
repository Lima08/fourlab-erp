import type { Evidence, SyncQueueEntry } from '@/shared/db/dexie'

export type EvidenceSyncErrorCode = 'MISSING_BLOB' | 'SIZE_LIMIT' | 'NOT_FOUND'

export class EvidenceSyncError extends Error {
  readonly code: EvidenceSyncErrorCode
  readonly mediaType?: Evidence['type']

  constructor(code: EvidenceSyncErrorCode, message: string, mediaType?: Evidence['type']) {
    super(message)
    this.name = 'EvidenceSyncError'
    this.code = code
    this.mediaType = mediaType
  }
}

export function buildDeadLetterToast(error: unknown, entryType: SyncQueueEntry['type']): string {
  void entryType
  if (error instanceof EvidenceSyncError) {
    switch (error.code) {
      case 'SIZE_LIMIT':
        if (error.mediaType === 'photo') return 'Foto excede limite após compressão'
        if (error.mediaType === 'video') return 'Vídeo excede limite após compressão'
        return 'Arquivo excede limite após compressão'
      case 'MISSING_BLOB':
        return 'Evidência sem arquivo — não foi possível sincronizar'
      case 'NOT_FOUND':
        return 'Evidência não encontrada — não foi possível sincronizar'
    }
  }

  return 'Falha ao sincronizar — verifique a conexão e tente novamente'
}
