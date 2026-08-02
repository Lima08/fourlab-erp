import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { EvidenceCard } from './EvidenceCard'
import type { Evidence } from '@/shared/db/dexie'

vi.mock('@/campo/hooks/useVideoThumbnail', () => ({
  useVideoThumbnail: vi.fn(() => ({ status: 'idle' as const })),
}))

vi.mock('@/campo/hooks/useMediaDisplayUrl', () => ({
  usePhotoDataUrl: vi.fn(() => ({ url: 'data:image/jpeg;base64,abc', status: 'ready' as const })),
  useVideoObjectUrl: vi.fn(() => ({ url: null, status: 'idle' as const })),
}))

import { useVideoThumbnail } from '@/campo/hooks/useVideoThumbnail'
import { usePhotoDataUrl } from '@/campo/hooks/useMediaDisplayUrl'

const mockUseVideoThumbnail = vi.mocked(useVideoThumbnail)
const mockUsePhotoDataUrl = vi.mocked(usePhotoDataUrl)

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: 'ev-1',
    itemId: 'item-1',
    type: 'photo',
    blob: new Blob(['img'], { type: 'image/jpeg' }),
    storagePath: null,
    comment: null,
    createdAt: new Date(),
    technicianId: 'tech-1',
    syncedAt: null,
    ...overrides,
  }
}

beforeEach(() => {
  mockUseVideoThumbnail.mockReturnValue({ status: 'idle' })
  mockUsePhotoDataUrl.mockReturnValue({ url: 'data:image/jpeg;base64,abc', status: 'ready' })
})

afterEach(cleanup)

describe('EvidenceCard', () => {
  it('renderiza thumbnail de foto via data URL', () => {
    render(<EvidenceCard evidence={makeEvidence()} onDelete={vi.fn()} />)

    const img = screen.getByRole('img', { name: 'Evidência' })
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,abc')
  })

  it('exibe loading enquanto foto carrega', () => {
    mockUsePhotoDataUrl.mockReturnValue({ url: null, status: 'loading' })

    render(<EvidenceCard evidence={makeEvidence()} onDelete={vi.fn()} />)

    expect(screen.getByTestId('evidence-video-thumbnail-loading')).toBeInTheDocument()
  })

  it('usa thumbnail de vídeo quando hook retorna frame pronto', () => {
    mockUseVideoThumbnail.mockReturnValue({ status: 'ready', url: 'blob:video-frame' })

    render(
      <EvidenceCard
        evidence={makeEvidence({ type: 'video', blob: new Blob(['v'], { type: 'video/mp4' }) })}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByRole('img', { name: 'Evidência' })).toHaveAttribute(
      'src',
      'blob:video-frame'
    )
  })

  it('chama onPreview ao tocar na área da mídia', () => {
    const onPreview = vi.fn()
    render(<EvidenceCard evidence={makeEvidence()} onDelete={vi.fn()} onPreview={onPreview} />)

    fireEvent.click(screen.getByTestId('evidence-preview-trigger'))
    expect(onPreview).toHaveBeenCalledWith('ev-1')
  })

  it('não renderiza trigger de preview para comentários', () => {
    render(
      <EvidenceCard
        evidence={makeEvidence({
          type: 'comment',
          blob: null,
          comment: 'Observação',
        })}
        onDelete={vi.fn()}
        onPreview={vi.fn()}
      />
    )

    expect(screen.queryByTestId('evidence-preview-trigger')).not.toBeInTheDocument()
    expect(screen.getByText('Observação')).toBeInTheDocument()
  })

  it('mantém card clicável sem blob local quando onPreview existe', () => {
    render(
      <EvidenceCard
        evidence={makeEvidence({ type: 'photo', blob: null })}
        onDelete={vi.fn()}
        onPreview={vi.fn()}
      />
    )

    expect(screen.getByTestId('evidence-preview-trigger')).toBeInTheDocument()
  })
})
