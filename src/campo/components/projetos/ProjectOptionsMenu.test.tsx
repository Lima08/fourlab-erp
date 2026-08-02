import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ProjectOptionsMenu } from './ProjectOptionsMenu'

const noop = vi.fn()

const baseProps = {
  isOnline: true,
  onSyncAction: noop,
  onPullUpdate: noop,
  onDownloadMedia: noop,
  onDeleteLocal: noop,
  onDownload: noop,
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProjectOptionsMenu', () => {
  it('não exibe "Ver detalhes do projeto" para projeto na nuvem', () => {
    render(<ProjectOptionsMenu {...baseProps} downloadState="cloud" syncState="synced" />)

    fireEvent.click(screen.getByRole('button', { name: 'Mais opções' }))

    expect(screen.queryByText('Ver detalhes do projeto')).not.toBeInTheDocument()
    expect(screen.queryByText('Verificar sincronização')).not.toBeInTheDocument()
    expect(screen.getByText('Remover do dispositivo')).toBeInTheDocument()
  })

  it('não exibe "Ver detalhes do projeto" para projeto no dispositivo', () => {
    render(<ProjectOptionsMenu {...baseProps} downloadState="device" syncState="synced" />)

    fireEvent.click(screen.getByRole('button', { name: 'Mais opções' }))

    expect(screen.queryByText('Ver detalhes do projeto')).not.toBeInTheDocument()
    expect(screen.getByText('Verificar sincronização')).toBeInTheDocument()
    expect(screen.getByText('Baixar mídias para offline')).toBeInTheDocument()
    expect(screen.getByText('Remover do dispositivo')).toBeInTheDocument()
  })
})
