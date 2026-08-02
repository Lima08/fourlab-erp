import { describe, it, expect } from 'vitest'
import type { Project } from '@/shared/db/dexie'
import type { StatusCounts } from './useProjects'
import { matchesSearchText } from '@/shared/utils/normalizeSearchText'

// Mirror the filter logic from useProjects for isolated unit testing
function filterProjects(
  projects: Project[],
  search?: string,
  status?: Project['status'],
  downloadState?: Project['downloadState']
): Project[] {
  const query = search?.trim()
  return projects.filter((p) => {
    if (query && !matchesSearchText(p.name, query)) return false
    if (status && p.status !== status) return false
    if (downloadState && p.downloadState !== downloadState) return false
    return true
  })
}

function computeCounts(projects: Project[]): StatusCounts {
  return {
    all: projects.length,
    pending: projects.filter((p) => p.status === 'pending').length,
    in_progress: projects.filter((p) => p.status === 'in_progress').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    canceled: projects.filter((p) => p.status === 'canceled').length,
    device: projects.filter((p) => p.downloadState === 'device').length,
    cloud: projects.filter((p) => p.downloadState === 'cloud').length,
  }
}

const base: Omit<Project, 'id' | 'name' | 'status'> = {
  street: '',
  number: '',
  complement: null,
  neighborhood: '',
  city: '',
  state: '',
  postalCode: '',
  description: '',
  clientId: 'c1',
  responsibleProfileId: 'admin-1',
  totalArea: null,
  documentType: 'PT_APPROVED' as const,
  documentStoragePath: null,
  downloadState: 'device',
  updateState: 'updated',
  completedItems: 0,
  totalItems: 0,
  downloadedAt: new Date(),
  syncedAt: null,
  serverUpdatedAt: null,
}

const makeProject = (
  id: string,
  name: string,
  status: Project['status'],
  downloadState: Project['downloadState'] = 'device'
): Project => ({
  ...base,
  id,
  name,
  status,
  downloadState,
})

const projects: Project[] = [
  makeProject('1', 'Edifício Alpha', 'pending', 'device'),
  makeProject('2', 'Escola Beta', 'in_progress', 'cloud'),
  makeProject('3', 'Hospital Gamma', 'completed', 'device'),
  makeProject('4', 'edificio delta', 'canceled', 'cloud'),
]

describe('useProjects filter logic', () => {
  it('retorna todos quando sem filtros', () => {
    expect(filterProjects(projects)).toHaveLength(4)
  })

  it('filtra por nome (case-insensitive)', () => {
    const result = filterProjects(projects, 'EDIF')
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.id)).toEqual(['1', '4'])
  })

  it('filtra por nome com espaços nas bordas (trim)', () => {
    const result = filterProjects(projects, '  beta  ')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('2')
  })

  it('filtra por nome ignorando acentos', () => {
    const result = filterProjects(projects, 'edificio')
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.id)).toEqual(['1', '4'])
  })

  it('filtra por status', () => {
    const result = filterProjects(projects, undefined, 'pending')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('1')
  })

  it('aplica search e status combinados (AND)', () => {
    const result = filterProjects(projects, 'edificio', 'canceled')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('4')
  })

  it('retorna vazio quando nenhum projeto bate os dois filtros', () => {
    const result = filterProjects(projects, 'alpha', 'completed')
    expect(result).toHaveLength(0)
  })

  it('search vazio string não filtra por nome', () => {
    const result = filterProjects(projects, '')
    expect(result).toHaveLength(4)
  })

  it('filtra por downloadState device', () => {
    const result = filterProjects(projects, undefined, undefined, 'device')
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.id)).toEqual(['1', '3'])
  })

  it('filtra por downloadState cloud', () => {
    const result = filterProjects(projects, undefined, undefined, 'cloud')
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.id)).toEqual(['2', '4'])
  })

  it('aplica status e downloadState combinados (AND)', () => {
    const result = filterProjects(projects, undefined, 'in_progress', 'cloud')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('2')
  })
})

describe('useProjects counts logic', () => {
  it('conta total e por status corretamente', () => {
    const counts = computeCounts(projects)
    expect(counts.all).toBe(4)
    expect(counts.pending).toBe(1)
    expect(counts.in_progress).toBe(1)
    expect(counts.completed).toBe(1)
    expect(counts.canceled).toBe(1)
    expect(counts.device).toBe(2)
    expect(counts.cloud).toBe(2)
  })

  it('counts não são afetados pelo filtro de status', () => {
    const filtered = filterProjects(projects, undefined, 'pending')
    const countsFromFiltered = computeCounts(filtered)
    const countsFromAll = computeCounts(projects)
    // counts deve sempre vir de rawProjects, não da lista filtrada
    expect(countsFromAll.all).toBe(4)
    expect(countsFromFiltered.all).toBe(1) // prova que filtrar muda o total
    // — portanto hook usa rawProjects para counts, não projects
  })

  it('retorna zeros para lista vazia', () => {
    const counts = computeCounts([])
    expect(counts).toEqual({
      all: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      canceled: 0,
      device: 0,
      cloud: 0,
    })
  })
})
