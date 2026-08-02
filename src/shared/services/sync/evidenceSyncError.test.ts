import { describe, it, expect } from 'vitest'
import { EvidenceSyncError, buildDeadLetterToast } from './evidenceSyncError'

describe('EvidenceSyncError', () => {
  it('expõe code e mediaType', () => {
    const error = new EvidenceSyncError('SIZE_LIMIT', 'too large', 'photo')

    expect(error.code).toBe('SIZE_LIMIT')
    expect(error.mediaType).toBe('photo')
    expect(error.message).toBe('too large')
  })
})

describe('buildDeadLetterToast', () => {
  it('retorna toast específico para SIZE_LIMIT de foto', () => {
    const error = new EvidenceSyncError('SIZE_LIMIT', 'Foto grande', 'photo')

    expect(buildDeadLetterToast(error, 'evidence_add')).toBe('Foto excede limite após compressão')
  })

  it('retorna toast específico para SIZE_LIMIT de vídeo', () => {
    const error = new EvidenceSyncError('SIZE_LIMIT', 'Vídeo grande', 'video')

    expect(buildDeadLetterToast(error, 'evidence_add')).toBe('Vídeo excede limite após compressão')
  })

  it('retorna toast específico para MISSING_BLOB', () => {
    const error = new EvidenceSyncError('MISSING_BLOB', 'Sem blob')

    expect(buildDeadLetterToast(error, 'evidence_add')).toBe(
      'Evidência sem arquivo — não foi possível sincronizar'
    )
  })

  it('retorna toast específico para NOT_FOUND', () => {
    const error = new EvidenceSyncError('NOT_FOUND', 'Não encontrada')

    expect(buildDeadLetterToast(error, 'evidence_add')).toBe(
      'Evidência não encontrada — não foi possível sincronizar'
    )
  })

  it('retorna toast genérico de rede para erro não tipado', () => {
    expect(buildDeadLetterToast(new Error('network'), 'evidence_add')).toBe(
      'Falha ao sincronizar — verifique a conexão e tente novamente'
    )
  })
})
