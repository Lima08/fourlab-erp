import { lazy, type ComponentType } from 'react'

export const CHUNK_RELOAD_KEY = 'soraia-chunk-reload'

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed/

export type ImportWithRetryDeps = {
  getRetryFlag: () => boolean
  setRetryFlag: () => void
  clearRetryFlag: () => void
  reload: () => void
}

export function createImportWithRetryDeps(): ImportWithRetryDeps {
  return {
    getRetryFlag: () => sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1',
    setRetryFlag: () => sessionStorage.setItem(CHUNK_RELOAD_KEY, '1'),
    clearRetryFlag: () => sessionStorage.removeItem(CHUNK_RELOAD_KEY),
    reload: () => window.location.reload(),
  }
}

export function isStaleChunkLoadError(error: unknown): boolean {
  return error instanceof TypeError && CHUNK_ERROR_PATTERN.test(error.message)
}

export async function importWithRetry<T>(
  factory: () => Promise<{ default: T }>,
  deps: ImportWithRetryDeps = createImportWithRetryDeps()
): Promise<{ default: T }> {
  const hasRetried = deps.getRetryFlag()

  try {
    const module = await factory()
    deps.clearRetryFlag()
    return module
  } catch (error) {
    if (isStaleChunkLoadError(error) && !hasRetried) {
      deps.setRetryFlag()
      deps.reload()
      return new Promise<{ default: T }>(() => {})
    }

    throw error
  }
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() => importWithRetry(factory))
}
