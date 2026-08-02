import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ProjectList } from './ProjectList'
import type { Project } from '@/shared/db/dexie'

vi.mock('@/campo/components/projetos/ProjectCard', () => ({
  ProjectCard: ({ project }: { project: Project }) => (
    <div data-testid="project-card">{project.name}</div>
  ),
}))

vi.mock('@/campo/components/projetos/ProjectCardSkeleton', () => ({
  ProjectCardSkeleton: () => <div data-testid="skeleton" />,
}))

vi.mock('@/campo/components/projetos/ProjectsEmptyState', () => ({
  ProjectsEmptyState: () => <div data-testid="empty-state">Nenhum projeto disponível</div>,
}))

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

const makeProject = (id: string, name: string): Project => ({
  ...base,
  id,
  name,
  status: 'pending',
})

const noop = () => {}

afterEach(cleanup)

describe('ProjectList', () => {
  it('exibe skeletons enquanto projects é undefined', () => {
    render(
      <ProjectList projects={undefined} isOnline={false} onContinue={noop} onDownload={noop} />
    )
    expect(screen.getAllByTestId('skeleton')).toHaveLength(4)
    expect(screen.getByLabelText('Carregando projetos')).toBeInTheDocument()
  })

  it('exibe skeletons ao atualizar nuvem com lista vazia', () => {
    render(
      <ProjectList
        projects={[]}
        isOnline={true}
        isRefreshing={true}
        onContinue={noop}
        onDownload={noop}
      />
    )
    expect(screen.getAllByTestId('skeleton')).toHaveLength(4)
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })

  it('mantém cards visíveis ao refresh sem banner que desloca o layout', () => {
    const projects = [makeProject('1', 'Alpha')]
    render(
      <ProjectList
        projects={projects}
        isOnline={true}
        isRefreshing={true}
        onContinue={noop}
        onDownload={noop}
      />
    )
    expect(screen.getByTestId('project-card')).toBeInTheDocument()
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
  })

  it('exibe empty state quando lista vazia sem filtros', () => {
    render(<ProjectList projects={[]} isOnline={true} onContinue={noop} onDownload={noop} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('exibe "Nenhum projeto encontrado" quando lista vazia com filtros ativos', () => {
    render(
      <ProjectList
        projects={[]}
        isOnline={true}
        onContinue={noop}
        onDownload={noop}
        hasActiveFilters={true}
      />
    )
    expect(screen.getByText('Nenhum projeto encontrado')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })

  it('renderiza cards para cada projeto', () => {
    const projects = [makeProject('1', 'Alpha'), makeProject('2', 'Beta')]
    render(<ProjectList projects={projects} isOnline={true} onContinue={noop} onDownload={noop} />)
    expect(screen.getAllByTestId('project-card')).toHaveLength(2)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })
})
