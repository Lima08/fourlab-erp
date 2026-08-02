import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/shared/db/dexie'
import type { Item } from '@/shared/db/dexie'
import {
  computeInspectionStats,
  deriveProjectStatus,
  recomputeProjectProgress,
  toggleInspectionFilter,
  formatProjectDate,
  formatProjectAddress,
} from './inspectionStats'

const makeItem = (id: string, status: Item['status'], deletedAt: Date | null = null): Item => ({
  id,
  projectId: 'p1',
  locationId: null,
  description: `Item ${id}`,
  category: 'other',
  status,
  deletedAt,
  deletedById: null,
  updatedAt: new Date(),
  technicianId: 't1',
  syncedAt: null,
  conflictStatus: false,
  conflictRemoteStatus: null,
})

const makeProject = () => ({
  id: 'p1',
  name: 'Projeto teste',
  street: 'Rua A',
  number: '1',
  complement: null,
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '01000-000',
  description: 'Desc',
  clientId: 'c1',
  responsibleProfileId: 'admin-1',
  totalArea: null,
  documentType: 'PT_APPROVED' as const,
  documentStoragePath: null,
  status: 'pending' as const,
  downloadState: 'device' as const,
  updateState: 'updated' as const,
  completedItems: 0,
  totalItems: 0,
  downloadedAt: new Date(),
  syncedAt: null,
  serverUpdatedAt: null,
})

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('computeInspectionStats', () => {
  it('retorna zeros quando não há itens', () => {
    expect(computeInspectionStats([])).toEqual({
      total: 0,
      completed: 0,
      pending: 0,
      regular: 0,
      irregular: 0,
      absent: 0,
      progressPct: 0,
    })
  })

  it('conta status por categoria e calcula progresso', () => {
    const items = [
      makeItem('1', 'regular'),
      makeItem('2', 'regular'),
      makeItem('3', 'pending'),
      makeItem('4', 'irregular'),
      makeItem('5', 'absent'),
    ]

    expect(computeInspectionStats(items)).toEqual({
      total: 5,
      completed: 4,
      pending: 1,
      regular: 2,
      irregular: 1,
      absent: 1,
      progressPct: 80,
    })
  })

  it('ignora itens com deletedAt preenchido', () => {
    const items = [makeItem('1', 'regular'), makeItem('2', 'pending', new Date())]

    expect(computeInspectionStats(items)).toEqual({
      total: 1,
      completed: 1,
      pending: 0,
      regular: 1,
      irregular: 0,
      absent: 0,
      progressPct: 100,
    })
  })
})

describe('deriveProjectStatus', () => {
  it('retorna pending quando nenhum item foi vistoriado', () => {
    expect(deriveProjectStatus({ completed: 0, total: 20 })).toBe('pending')
  })

  it('retorna in_progress quando há progresso parcial', () => {
    expect(deriveProjectStatus({ completed: 2, total: 20 })).toBe('in_progress')
  })

  it('retorna completed quando todos os itens foram vistoriados', () => {
    expect(deriveProjectStatus({ completed: 20, total: 20 })).toBe('completed')
  })

  it('retorna pending quando não há itens', () => {
    expect(deriveProjectStatus({ completed: 0, total: 0 })).toBe('pending')
  })
})

describe('recomputeProjectProgress', () => {
  it('atualiza projeto para in_progress após vistoriar itens', async () => {
    await db.projects.add(makeProject())
    await db.items.bulkAdd([
      makeItem('1', 'irregular'),
      makeItem('2', 'irregular'),
      ...Array.from({ length: 18 }, (_, i) => makeItem(String(i + 3), 'pending')),
    ])

    await recomputeProjectProgress('p1')

    const project = await db.projects.get('p1')
    expect(project?.status).toBe('in_progress')
    expect(project?.completedItems).toBe(2)
    expect(project?.totalItems).toBe(20)
  })

  it('enfileira project_update quando status muda', async () => {
    await db.projects.add(makeProject())
    await db.items.bulkAdd([makeItem('1', 'irregular'), makeItem('2', 'pending')])

    await recomputeProjectProgress('p1')

    const entries = await db.syncQueue.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0]?.type).toBe('project_update')
    expect(JSON.parse(entries[0]!.payload)).toEqual({
      projectId: 'p1',
      status: 'in_progress',
    })
  })

  it('preserva status canceled', async () => {
    await db.projects.add({ ...makeProject(), status: 'canceled' })
    await db.items.bulkAdd([makeItem('1', 'irregular'), makeItem('2', 'regular')])

    await recomputeProjectProgress('p1')

    const project = await db.projects.get('p1')
    expect(project?.status).toBe('canceled')
    expect(project?.completedItems).toBe(2)
    expect(project?.totalItems).toBe(2)
    expect(await db.syncQueue.count()).toBe(0)
  })
})

describe('toggleInspectionFilter', () => {
  it('ativa filtro quando diferente do atual', () => {
    expect(toggleInspectionFilter('all', 'pending')).toBe('pending')
  })

  it('desativa filtro ao clicar no mesmo card', () => {
    expect(toggleInspectionFilter('pending', 'pending')).toBe('all')
  })
})

describe('formatProjectDate', () => {
  it('formata data em pt-BR', () => {
    const formatted = formatProjectDate(new Date('2026-03-15T12:00:00'))
    expect(formatted).toMatch(/15/)
    expect(formatted).toMatch(/2026/)
  })
})

describe('formatProjectAddress', () => {
  it('monta endereço completo', () => {
    expect(
      formatProjectAddress({
        street: 'Rua Direita',
        number: '100',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      })
    ).toBe('Rua Direita, 100 — Centro · São Paulo / SP')
  })
})
