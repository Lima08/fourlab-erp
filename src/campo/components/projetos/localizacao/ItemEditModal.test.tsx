import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ItemEditModal } from './ItemEditModal'
import type { ItemCategory, ItemStatus } from '@/shared/db/dexie'

vi.mock('./EvidenceCard', () => ({
  EvidenceCard: ({
    evidence,
    onDelete,
  }: {
    evidence: { id: string; comment: string | null; type: string }
    onDelete: (id: string) => void
  }) => (
    <div data-testid="evidence-card">
      {evidence.type === 'comment' && evidence.comment ? (
        <p>{evidence.comment}</p>
      ) : null}
      <button type="button" aria-label="Excluir observação" onClick={() => onDelete(evidence.id)}>
        delete
      </button>
    </div>
  ),
}))

const addPendingComment = vi.fn()
const updatePendingComment = vi.fn()
const removePendingComment = vi.fn()
const addMedia = vi.fn()
const handleSave = vi.fn()
const patchForm = vi.fn()
const markDelete = vi.fn()
const removePendingMedia = vi.fn()

const defaultForm = {
  description: 'Extintor hall',
  category: 'extinguisher' as ItemCategory,
  locationId: '',
  status: 'irregular' as ItemStatus,
}

function buildMock(overrides: Record<string, unknown> = {}) {
  return {
    locations: [],
    isLoading: false,
    form: defaultForm,
    patchForm,
    evidences: [],
    pendingComments: [],
    addPendingComment,
    updatePendingComment,
    removePendingComment,
    pendingDeletes: new Set<string>(),
    markDelete,
    pendingMedia: [],
    addMedia,
    removePendingMedia,
    evidenceCount: 0,
    canSave: false,
    isProcessingMedia: false,
    handleSave,
    isSaving: false,
    ...overrides,
  }
}

let mockHook = buildMock()

vi.mock('@/campo/hooks/useItemEdit', () => ({
  useItemEdit: () => mockHook,
}))

beforeEach(() => {
  mockHook = buildMock()
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('ItemEditModal — botões de captura', () => {
  it('renderiza 4 botões de captura', () => {
    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)

    expect(screen.getByTestId('btn-photo-camera')).toBeInTheDocument()
    expect(screen.getByTestId('btn-gallery')).toBeInTheDocument()
    expect(screen.getByTestId('btn-video-camera')).toBeInTheDocument()
    expect(screen.getByTestId('btn-comment')).toBeInTheDocument()
    expect(screen.queryByTestId('btn-photo-gallery')).not.toBeInTheDocument()
    expect(screen.queryByTestId('btn-video-gallery')).not.toBeInTheDocument()
  })

  it('clicar "Tirar Foto" está ligado ao input de câmera de foto', () => {
    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)

    const trigger = screen.getByTestId('btn-photo-camera')
    const photoCamera = screen.getByTestId('photo-camera-input')

    expect(trigger).toHaveAttribute('for', 'item-photo-camera')
    expect(photoCamera).toHaveAttribute('id', 'item-photo-camera')
    expect(photoCamera).toHaveAttribute('capture', 'environment')
    expect(photoCamera).toHaveAttribute('accept', 'image/*')
    expect(photoCamera).toHaveClass('sr-only')
  })

  it('input de galeria de foto mantém atributos corretos', () => {
    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)

    const photoGallery = screen.getByTestId('photo-gallery-input')

    expect(photoGallery).toHaveAttribute('id', 'item-photo-gallery')
    expect(photoGallery).toHaveAttribute('accept', 'image/*')
    expect(photoGallery).not.toHaveAttribute('capture')
    expect(photoGallery).toHaveClass('sr-only')
  })

  it('selecionar "Foto" no menu aciona input de galeria de foto', () => {
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click')

    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)

    fireEvent.click(screen.getByTestId('btn-gallery'))
    fireEvent.click(screen.getByTestId('btn-gallery-photo'))

    const photoGallery = screen.getByTestId('photo-gallery-input')
    expect(clickSpy).toHaveBeenCalled()
    expect(clickSpy.mock.instances.at(-1)).toBe(photoGallery)

    clickSpy.mockRestore()
  })
})

describe('ItemEditModal — bloqueio de save', () => {
  it('item irregular sem evidência desabilita save e exibe aviso', () => {
    mockHook = buildMock({ canSave: false, evidenceCount: 0 })

    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeDisabled()
    expect(
      screen.getByText('Adicione ao menos uma evidência para itens irregulares')
    ).toBeInTheDocument()
  })

  it('item irregular com evidência habilita save e oculta aviso', () => {
    mockHook = buildMock({
      canSave: true,
      evidenceCount: 1,
      pendingComments: ['Observação'],
    })

    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeEnabled()
    expect(
      screen.queryByText('Adicione ao menos uma evidência para itens irregulares')
    ).not.toBeInTheDocument()
  })

  it('item regular sem evidência habilita save', () => {
    mockHook = buildMock({
      form: { ...defaultForm, status: 'regular' },
      canSave: true,
      evidenceCount: 0,
    })

    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeEnabled()
    expect(
      screen.queryByText('Adicione ao menos uma evidência para itens irregulares')
    ).not.toBeInTheDocument()
  })
})

describe('ItemEditModal — composer de comentário', () => {
  it('clicar "Comentário" abre o composer sem adicionar rascunho', () => {
    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('btn-comment'))

    expect(screen.getByTestId('comment-composer')).toBeInTheDocument()
    expect(addPendingComment).not.toHaveBeenCalled()
  })

  it('Adicionar confirma o texto e chama addPendingComment', () => {
    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('btn-comment'))

    fireEvent.change(screen.getByTestId('comment-composer-input'), {
      target: { value: '  Porta emperrada  ' },
    })
    fireEvent.click(screen.getByTestId('comment-composer-add'))

    expect(addPendingComment).toHaveBeenCalledWith('Porta emperrada')
    expect(screen.queryByTestId('comment-composer')).not.toBeInTheDocument()
  })

  it('Adicionar fica desabilitado com texto vazio', () => {
    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('btn-comment'))

    expect(screen.getByTestId('comment-composer-add')).toBeDisabled()
  })

  it('Cancelar fecha o composer sem adicionar', () => {
    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)
    fireEvent.click(screen.getByTestId('btn-comment'))
    fireEvent.change(screen.getByTestId('comment-composer-input'), {
      target: { value: 'rascunho' },
    })
    fireEvent.click(screen.getByTestId('comment-composer-cancel'))

    expect(screen.queryByTestId('comment-composer')).not.toBeInTheDocument()
    expect(addPendingComment).not.toHaveBeenCalled()
  })

  it('comentários confirmados aparecem como cards fechados, não textareas', () => {
    mockHook = buildMock({
      pendingComments: ['Primeiro', 'Segundo'],
      evidenceCount: 2,
      canSave: true,
    })

    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)

    expect(screen.getByText('Primeiro')).toBeInTheDocument()
    expect(screen.getByText('Segundo')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Primeiro')).not.toBeInTheDocument()
    expect(screen.queryByTestId('comment-composer')).not.toBeInTheDocument()
  })

  it('remover comentário confirmado chama removePendingComment', () => {
    mockHook = buildMock({
      pendingComments: ['Único'],
      evidenceCount: 1,
      canSave: true,
    })

    render(<ItemEditModal itemId="item-1" projectId="proj-1" onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Excluir observação' }))

    expect(removePendingComment).toHaveBeenCalledWith(0)
  })
})
