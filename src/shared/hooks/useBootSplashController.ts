import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/shared/stores/authStore'
import {
  BOOT_SPLASH_ELEMENT_ID,
  BOOT_SPLASH_FADE_MS,
  BOOT_SPLASH_HANDOFF_MS,
  BOOT_SPLASH_MIN_MS,
} from '@/shared/constants/bootSplash'

type BootPhase = 'visible' | 'fading' | 'gone'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function removeHtmlBootSplash(): void {
  document.getElementById(BOOT_SPLASH_ELEMENT_ID)?.remove()
}

/**
 * Controla o splash de boot: hand-off do HTML pré-React,
 * mínimo anti-flicker e fade-out respeitando prefers-reduced-motion.
 */
export function useBootSplashController() {
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const [phase, setPhase] = useState<BootPhase>('visible')
  const [logoLanded, setLogoLanded] = useState(false)
  const startedAt = useRef(0)

  useEffect(() => {
    startedAt.current = typeof performance !== 'undefined' ? performance.now() : Date.now()
    removeHtmlBootSplash()
  }, [])

  useEffect(() => {
    if (isInitializing || phase !== 'visible') return

    const reduceMotion = prefersReducedMotion()
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const elapsed = startedAt.current === 0 ? 0 : now - startedAt.current
    const wait = reduceMotion ? 0 : Math.max(0, BOOT_SPLASH_MIN_MS - elapsed)

    const timer = window.setTimeout(() => {
      if (reduceMotion) {
        setLogoLanded(true)
        setPhase('gone')
        return
      }
      setPhase('fading')
    }, wait)

    return () => window.clearTimeout(timer)
  }, [isInitializing, phase])

  useEffect(() => {
    if (phase !== 'fading') return

    const handoffAt = Math.max(0, BOOT_SPLASH_FADE_MS - BOOT_SPLASH_HANDOFF_MS)
    const landTimer = window.setTimeout(() => {
      setLogoLanded(true)
    }, handoffAt)

    // Mantém splash um pouco após o pouso para crossfade sem piscar
    const goneTimer = window.setTimeout(() => {
      setPhase('gone')
    }, BOOT_SPLASH_FADE_MS + BOOT_SPLASH_HANDOFF_MS)

    return () => {
      window.clearTimeout(landTimer)
      window.clearTimeout(goneTimer)
    }
  }, [phase])

  return {
    show: phase !== 'gone',
    fading: phase === 'fading',
    logoLanded,
  }
}
