import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/shared/stores/authStore'
import {
  BOOT_SPLASH_ELEMENT_ID,
  BOOT_SPLASH_FADE_MS,
  BOOT_SPLASH_HANDOFF_MS,
  BOOT_SPLASH_MIN_MS,
} from '@/shared/constants/bootSplash'
import { useBootSplashController } from './useBootSplashController'

beforeEach(() => {
  vi.useFakeTimers()
  useAuthStore.setState({ isInitializing: true, user: null, sessionExpired: false })
  document.getElementById(BOOT_SPLASH_ELEMENT_ID)?.remove()
  const el = document.createElement('div')
  el.id = BOOT_SPLASH_ELEMENT_ID
  document.body.appendChild(el)
})

afterEach(() => {
  vi.useRealTimers()
  document.getElementById(BOOT_SPLASH_ELEMENT_ID)?.remove()
  useAuthStore.setState({ isInitializing: true, user: null, sessionExpired: false })
})

describe('useBootSplashController', () => {
  it('remove o splash HTML no mount', () => {
    renderHook(() => useBootSplashController())

    expect(document.getElementById(BOOT_SPLASH_ELEMENT_ID)).toBeNull()
  })

  it('permanece visível enquanto auth inicializa', () => {
    const { result } = renderHook(() => useBootSplashController())

    act(() => {
      vi.advanceTimersByTime(BOOT_SPLASH_MIN_MS + 100)
    })

    expect(result.current.show).toBe(true)
    expect(result.current.fading).toBe(false)
  })

  it('só inicia dismiss após ready e mínimo anti-flicker', () => {
    const { result } = renderHook(() => useBootSplashController())

    act(() => {
      useAuthStore.setState({ isInitializing: false })
    })

    act(() => {
      vi.advanceTimersByTime(BOOT_SPLASH_MIN_MS - 50)
    })
    expect(result.current.show).toBe(true)
    expect(result.current.fading).toBe(false)

    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(result.current.fading).toBe(true)
    expect(result.current.show).toBe(true)
    expect(result.current.logoLanded).toBe(false)

    act(() => {
      vi.advanceTimersByTime(BOOT_SPLASH_FADE_MS - BOOT_SPLASH_HANDOFF_MS)
    })
    expect(result.current.logoLanded).toBe(true)
    expect(result.current.show).toBe(true)

    act(() => {
      vi.advanceTimersByTime(BOOT_SPLASH_HANDOFF_MS * 2)
    })
    expect(result.current.show).toBe(false)
  })

  it('com prefers-reduced-motion, some assim que ready', () => {
    const matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.stubGlobal('matchMedia', matchMedia)

    const { result } = renderHook(() => useBootSplashController())

    act(() => {
      useAuthStore.setState({ isInitializing: false })
    })

    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(result.current.show).toBe(false)
    expect(result.current.logoLanded).toBe(true)
    vi.unstubAllGlobals()
  })
})
