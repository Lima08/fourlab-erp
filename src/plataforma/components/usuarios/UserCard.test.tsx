import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { UserCard } from './UserCard'
import type { Profile } from '@/shared/types/profile'

const noop = vi.fn()

const baseProfile: Profile = {
  id: '1',
  fullName: 'Ana Silva',
  email: 'ana@exemplo.com',
  phone: '(11) 98765-4321',
  role: 'cliente',
  status: 'ativo',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderCard(overrides: Partial<Profile> = {}) {
  const profile = { ...baseProfile, ...overrides }
  return render(
    <UserCard
      profile={profile}
      isLastAdmin={false}
      onEdit={noop}
      onSuspend={noop}
      onRemove={noop}
      onManageAccess={noop}
      onResendInvite={noop}
    />
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('UserCard', () => {
  it('exibe tags de função e status para usuário ativo', () => {
    renderCard({ status: 'ativo', role: 'admin' })

    expect(screen.getAllByText('Administrador').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Ativo').length).toBeGreaterThanOrEqual(1)
  })

  it('exibe tag Convite pendente para usuário pendente', () => {
    renderCard({ status: 'convite_pendente' })

    expect(screen.getAllByText('Convite pendente').length).toBeGreaterThanOrEqual(1)
  })

  it('exibe tag Suspenso para usuário suspenso', () => {
    renderCard({ status: 'suspenso' })

    expect(screen.getAllByText('Suspenso').length).toBeGreaterThanOrEqual(1)
  })

  it('exibe botão Reenviar convite para status convite_pendente', () => {
    renderCard({ status: 'convite_pendente' })

    expect(screen.getByRole('button', { name: 'Reenviar convite' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gerenciar acesso' })).not.toBeInTheDocument()
  })

  it('exibe botão Gerenciar acesso para status ativo', () => {
    renderCard({ status: 'ativo' })

    expect(screen.getByRole('button', { name: 'Gerenciar acesso' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reenviar convite' })).not.toBeInTheDocument()
  })

  it('exibe botão Gerenciar acesso para status suspenso', () => {
    renderCard({ status: 'suspenso' })

    expect(screen.getByRole('button', { name: 'Gerenciar acesso' })).toBeInTheDocument()
  })

  it('exibe telefone como "-" quando phone é null', () => {
    renderCard({ phone: null })

    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.queryByText('(11) 98765-4321')).not.toBeInTheDocument()
  })

  it('exibe email como "-" quando email está vazio', () => {
    renderCard({ email: '' })

    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('exibe menu com opções Editar, Suspender e Remover', () => {
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: /Opções de Ana Silva/i }))

    expect(screen.getByText('Editar usuário')).toBeInTheDocument()
    expect(screen.getByText('Suspender acesso')).toBeInTheDocument()
    expect(screen.getByText('Remover usuário')).toBeInTheDocument()
  })
})
