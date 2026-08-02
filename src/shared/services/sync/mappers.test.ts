import { describe, it, expect } from 'vitest'
import { toLocalClient, toLocalProject, toRemoteEvidence } from './mappers'
import type { Evidence } from '@/shared/db/dexie'
import type { Tables } from '@/shared/db/database.types'

const makeEvidence = (overrides: Partial<Evidence> = {}): Evidence => ({
  id: 'ev-001',
  itemId: 'item-001',
  type: 'photo',
  blob: null,
  storagePath: null,
  comment: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  technicianId: 'tech-1',
  syncedAt: null,
  ...overrides,
})

const makeRemoteClient = (overrides: Partial<Tables<'clients'>> = {}): Tables<'clients'> => ({
  id: 'client-1',
  name: 'Condomínio Teste',
  phone: '(11) 99999-9999',
  auth_user_id: null,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makeRemoteProject = (
  overrides: Partial<Tables<'projects'>> & {
    responsible_profile_id?: string
    total_area?: number | null
    document_type?: string
    document_storage_path?: string | null
  } = {}
) => ({
  id: 'proj-1',
  client_id: 'client-1',
  responsible_profile_id: 'admin-1',
  name: 'Projeto Teste',
  description: 'Descrição',
  street: 'Rua A',
  number: '100',
  complement: null,
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postal_code: '01001-000',
  status: 'pending',
  total_area: 150.5,
  document_type: 'PT_APPROVED',
  document_storage_path: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('toLocalClient', () => {
  it('mapeia campos essenciais do cliente', () => {
    const result = toLocalClient(makeRemoteClient())

    expect(result).toEqual({
      id: 'client-1',
      name: 'Condomínio Teste',
      phone: '(11) 99999-9999',
    })
  })
})

describe('toLocalProject', () => {
  it('mapeia metadados novos incluindo document_storage_path null', () => {
    const result = toLocalProject(makeRemoteProject())

    expect(result.clientId).toBe('client-1')
    expect(result.responsibleProfileId).toBe('admin-1')
    expect(result.totalArea).toBe(150.5)
    expect(result.documentType).toBe('PT_APPROVED')
    expect(result.documentStoragePath).toBeNull()
  })

  it('mapeia document_storage_path quando presente', () => {
    const result = toLocalProject(
      makeRemoteProject({ document_storage_path: 'proj-1/pt-aprovado.pdf' })
    )

    expect(result.documentStoragePath).toBe('proj-1/pt-aprovado.pdf')
  })
})

describe('toRemoteEvidence', () => {
  it('mapeia comentário com blob_url null', () => {
    const ev = makeEvidence({ type: 'comment', comment: 'Observação na vistoria' })

    const result = toRemoteEvidence(ev, null, 'user-1')

    expect(result.blob_url).toBeNull()
    expect(result.comment).toBe('Observação na vistoria')
    expect(result.type).toBe('comment')
    expect(result.technician_id).toBe('user-1')
  })

  it('mapeia foto com path string em blob_url', () => {
    const ev = makeEvidence({ type: 'photo' })
    const path = 'proj-1/item-001/ev-001'

    const result = toRemoteEvidence(ev, path, 'user-1')

    expect(result.blob_url).toBe(path)
    expect(result.id).toBe('ev-001')
    expect(result.item_id).toBe('item-001')
  })
})
