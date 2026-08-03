import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePullToRefresh } from './usePullToRefresh'

describe('usePullToRefresh', () => {
  it('retorna uma ref utilizável', () => {
    const onRefresh = vi.fn()
    const { result } = renderHook(() => usePullToRefresh<HTMLDivElement>({ onRefresh }))
    expect(result.current.current).toBeNull()
  })
})
