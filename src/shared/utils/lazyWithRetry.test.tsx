import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Suspense } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import {
  CHUNK_RELOAD_KEY,
  importWithRetry,
  isStaleChunkLoadError,
  lazyWithRetry,
  type ImportWithRetryDeps,
} from './lazyWithRetry'

function makeDeps(overrides: Partial<ImportWithRetryDeps> = {}): ImportWithRetryDeps {
  return {
    getRetryFlag: vi.fn(() => false),
    setRetryFlag: vi.fn(),
    clearRetryFlag: vi.fn(),
    reload: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  sessionStorage.clear()
})

afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('isStaleChunkLoadError', () => {
  it('identifica erro de chunk dinâmico do Vite', () => {
    expect(
      isStaleChunkLoadError(
        new TypeError(
          'Failed to fetch dynamically imported module: http://localhost:4173/assets/HomePage-P3nfusC3.js'
        )
      )
    ).toBe(true)
  })

  it('identifica erro genérico de import de módulo', () => {
    expect(isStaleChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
  })

  it('ignora outros erros', () => {
    expect(isStaleChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(
      false
    )
    expect(isStaleChunkLoadError(new TypeError('Network request failed'))).toBe(false)
  })
})

describe('importWithRetry', () => {
  it('retorna módulo e limpa flag após sucesso', async () => {
    const deps = makeDeps()
    const module = { default: () => null }

    await expect(importWithRetry(() => Promise.resolve(module), deps)).resolves.toBe(module)
    expect(deps.clearRetryFlag).toHaveBeenCalledOnce()
    expect(deps.reload).not.toHaveBeenCalled()
  })

  it('recarrega página na primeira falha de chunk stale', async () => {
    const deps = makeDeps()
    const chunkError = new TypeError(
      'Failed to fetch dynamically imported module: http://localhost:4173/assets/HomePage-P3nfusC3.js'
    )

    void importWithRetry(() => Promise.reject(chunkError), deps)

    await vi.waitFor(() => {
      expect(deps.setRetryFlag).toHaveBeenCalledOnce()
      expect(deps.reload).toHaveBeenCalledOnce()
    })
  })

  it('propaga erro na segunda falha de chunk stale', async () => {
    const deps = makeDeps({ getRetryFlag: vi.fn(() => true) })
    const chunkError = new TypeError(
      'Failed to fetch dynamically imported module: http://localhost:4173/assets/HomePage-P3nfusC3.js'
    )

    await expect(importWithRetry(() => Promise.reject(chunkError), deps)).rejects.toThrow(
      chunkError
    )
    expect(deps.reload).not.toHaveBeenCalled()
  })

  it('propaga erro que não é de chunk stale', async () => {
    const deps = makeDeps()
    const error = new TypeError('Network request failed')

    await expect(importWithRetry(() => Promise.reject(error), deps)).rejects.toThrow(error)
    expect(deps.reload).not.toHaveBeenCalled()
    expect(deps.setRetryFlag).not.toHaveBeenCalled()
  })

  it('usa sessionStorage real para marcar retry', async () => {
    const reload = vi.fn()
    const deps = createRealDeps(reload)
    const chunkError = new TypeError('Importing a module script failed.')

    void importWithRetry(() => Promise.reject(chunkError), deps)

    await vi.waitFor(() => {
      expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).toBe('1')
      expect(reload).toHaveBeenCalledOnce()
    })
  })
})

describe('lazyWithRetry', () => {
  it('carrega componente lazy após import bem-sucedido', async () => {
    function LoadedPage() {
      return <div>Página carregada</div>
    }

    const LazyPage = lazyWithRetry(() => Promise.resolve({ default: LoadedPage }))

    render(
      <Suspense fallback={<div>Carregando</div>}>
        <LazyPage />
      </Suspense>
    )

    await waitFor(() => {
      expect(screen.getByText('Página carregada')).toBeInTheDocument()
    })
  })
})

function createRealDeps(reload: () => void): ImportWithRetryDeps {
  return {
    getRetryFlag: () => sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1',
    setRetryFlag: () => sessionStorage.setItem(CHUNK_RELOAD_KEY, '1'),
    clearRetryFlag: () => sessionStorage.removeItem(CHUNK_RELOAD_KEY),
    reload,
  }
}
