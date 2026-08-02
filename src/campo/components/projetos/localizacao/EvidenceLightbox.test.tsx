import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { EvidenceLightbox, type PreviewMediaItem } from './EvidenceLightbox'

vi.mock('@/campo/hooks/useMediaDisplayUrl', () => ({
  usePhotoDataUrl: vi.fn(() => ({
    url: 'data:image/jpeg;base64,preview',
    status: 'ready' as const,
  })),
  useVideoObjectUrl: vi.fn(() => ({
    url: 'blob:video-preview',
    status: 'ready' as const,
  })),
}))

import { usePhotoDataUrl, useVideoObjectUrl } from '@/campo/hooks/useMediaDisplayUrl'

const mockUsePhotoDataUrl = vi.mocked(usePhotoDataUrl)
const mockUseVideoObjectUrl = vi.mocked(useVideoObjectUrl)

const photoItem: PreviewMediaItem = {
  id: 'ev-photo',
  type: 'photo',
  blob: new Blob(['img'], { type: 'image/jpeg' }),
}

const videoItem: PreviewMediaItem = {
  id: 'ev-video',
  type: 'video',
  blob: new Blob(['vid'], { type: 'video/mp4' }),
}

function renderLightbox(props: Partial<ComponentProps<typeof EvidenceLightbox>> = {}) {
  const onIndexChange = vi.fn()
  render(
    <EvidenceLightbox
      open
      items={[photoItem]}
      index={0}
      onIndexChange={onIndexChange}
      onClose={vi.fn()}
      resolveBlob={vi.fn()}
      {...props}
    />
  )
  return { onIndexChange }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUsePhotoDataUrl.mockReturnValue({
    url: 'data:image/jpeg;base64,preview',
    status: 'ready',
  })
  mockUseVideoObjectUrl.mockReturnValue({
    url: 'blob:video-preview',
    status: 'ready',
  })
})

afterEach(cleanup)

describe('EvidenceLightbox', () => {
  it('exibe foto em object-contain quando aberto', () => {
    renderLightbox()

    const img = screen.getByTestId('evidence-lightbox-photo')
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,preview')
    expect(img).toHaveClass('object-contain')
  })

  it('exibe vídeo com controles e autoplay mudo', () => {
    renderLightbox({ items: [videoItem], index: 0 })

    const video = screen.getByTestId('evidence-lightbox-video')
    expect(video).toHaveAttribute('src', 'blob:video-preview')
    expect(video).toHaveProperty('muted', true)
    expect(video).toHaveProperty('autoplay', true)
    expect(video).toHaveProperty('controls', true)
  })

  it('navega para próxima mídia com setas', () => {
    const onIndexChange = vi.fn()
    render(
      <EvidenceLightbox
        open
        items={[photoItem, videoItem]}
        index={0}
        onIndexChange={onIndexChange}
        onClose={vi.fn()}
        resolveBlob={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('evidence-lightbox-next'))
    expect(onIndexChange).toHaveBeenCalledWith(1)
  })

  it('desabilita seta anterior na primeira mídia', () => {
    renderLightbox({ items: [photoItem, videoItem], index: 0 })

    expect(screen.getByTestId('evidence-lightbox-prev')).toBeDisabled()
    expect(screen.getByTestId('evidence-lightbox-next')).toBeEnabled()
  })

  it('resolve blob remoto quando item não tem blob local', async () => {
    const resolveBlob = vi.fn().mockResolvedValue(new Blob(['remote'], { type: 'image/jpeg' }))
    const remoteItem: PreviewMediaItem = { id: 'ev-remote', type: 'photo', blob: null }

    mockUsePhotoDataUrl.mockReturnValueOnce({ url: null, status: 'loading' })
    mockUsePhotoDataUrl.mockReturnValue({
      url: 'data:image/jpeg;base64,remote',
      status: 'ready',
    })

    render(
      <EvidenceLightbox
        open
        items={[remoteItem]}
        index={0}
        onIndexChange={vi.fn()}
        onClose={vi.fn()}
        resolveBlob={resolveBlob}
      />
    )

    await waitFor(() => {
      expect(resolveBlob).toHaveBeenCalledWith(remoteItem)
    })
  })

  it('exibe erro quando resolveBlob falha', async () => {
    const resolveBlob = vi.fn().mockRejectedValue(new Error('Evidência indisponível offline'))

    render(
      <EvidenceLightbox
        open
        items={[{ id: 'ev-remote', type: 'photo', blob: null }]}
        index={0}
        onIndexChange={vi.fn()}
        onClose={vi.fn()}
        resolveBlob={resolveBlob}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('evidence-lightbox-error')).toHaveTextContent(
        'Evidência indisponível offline'
      )
    })
  })

  it('chama onClose ao clicar no botão fechar', () => {
    const onClose = vi.fn()
    render(
      <EvidenceLightbox
        open
        items={[photoItem]}
        index={0}
        onIndexChange={vi.fn()}
        onClose={onClose}
        resolveBlob={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('evidence-lightbox-close'))
    expect(onClose).toHaveBeenCalled()
  })
})
