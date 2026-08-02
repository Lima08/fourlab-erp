import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ProjectInfoSection } from './ProjectInfoSection'
import type { Project } from '@/shared/db/dexie'

const project: Project = {
  id: 'p1',
  name: 'Edifício Comercial Centro',
  street: 'Rua Direita',
  number: '100',
  complement: null,
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '01000-000',
  description:
    'Atenção especial à central de alarme no pavimento térreo. Verificar extintores da garagem.',
  clientId: 'c1',
  responsibleProfileId: 'admin-1',
  totalArea: null,
  documentType: 'PT_APPROVED' as const,
  documentStoragePath: null,
  status: 'in_progress',
  downloadState: 'device',
  updateState: 'updated',
  completedItems: 12,
  totalItems: 48,
  createdAt: new Date('2026-01-10T10:00:00'),
  downloadedAt: new Date('2026-06-01T10:00:00'),
  syncedAt: null,
  serverUpdatedAt: null,
}

afterEach(cleanup)

describe('ProjectInfoSection', () => {
  it('exibe nome, cliente, endereço, status e data de criação', () => {
    render(
      <ProjectInfoSection
        project={project}
        clientName="Adm. Predial Souza Ltda."
        syncState="pending"
      />
    )

    expect(screen.getByRole('heading', { name: project.name })).toBeInTheDocument()
    expect(screen.getByText('Adm. Predial Souza Ltda.')).toBeInTheDocument()
    expect(screen.getByText(/Rua Direita, 100 — Centro/)).toBeInTheDocument()
    expect(screen.getByText(/Criado em/)).toBeInTheDocument()
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
    expect(screen.getByText('Pendente de envio')).toBeInTheDocument()
  })

  it('exibe observações gerais quando há descrição', () => {
    render(<ProjectInfoSection project={project} clientName="Cliente Teste" syncState="synced" />)

    expect(screen.getByText('Observações gerais')).toBeInTheDocument()
    expect(screen.getByText(project.description)).toBeInTheDocument()
  })

  it('omite cliente quando clientName é null', () => {
    render(<ProjectInfoSection project={project} clientName={null} syncState="synced" />)

    expect(screen.queryByText('Adm. Predial Souza Ltda.')).not.toBeInTheDocument()
  })

  it('exibe contador de pendentes quando syncPendingCount > 0', () => {
    render(
      <ProjectInfoSection
        project={project}
        clientName="Cliente Teste"
        syncState="pending"
        syncPendingCount={3}
      />
    )

    expect(screen.getByText('Pendente (3)')).toBeInTheDocument()
    expect(screen.queryByText('Pendente de envio')).not.toBeInTheDocument()
  })

  it('usa downloadedAt como fallback da data de criação', () => {
    const withoutCreatedAt = { ...project, createdAt: undefined }
    render(
      <ProjectInfoSection
        project={withoutCreatedAt}
        clientName="Cliente Teste"
        syncState="synced"
      />
    )

    expect(screen.getByText(/Criado em/)).toBeInTheDocument()
  })
})
