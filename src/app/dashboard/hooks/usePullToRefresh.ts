import { useEffect, useRef, type RefObject } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<unknown>
  disabled?: boolean
  thresholdPx?: number
}

export function usePullToRefresh<T extends HTMLElement>({
  onRefresh,
  disabled = false,
  thresholdPx = 64,
}: UsePullToRefreshOptions): RefObject<T | null> {
  const ref = useRef<T | null>(null)
  const startY = useRef(0)
  const pulling = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || disabled) return

    const onTouchStart = (event: TouchEvent) => {
      if (el.scrollTop > 0) return
      startY.current = event.touches[0]?.clientY ?? 0
      pulling.current = true
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!pulling.current) return
      const currentY = event.touches[0]?.clientY ?? 0
      const delta = currentY - startY.current
      if (delta > thresholdPx) {
        pulling.current = false
        void onRefresh()
      }
    }

    const onTouchEnd = () => {
      pulling.current = false
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [disabled, onRefresh, thresholdPx])

  return ref
}
