import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import { BootSplash } from './BootSplash'

afterEach(() => {
  cleanup()
  document.querySelector('[data-login-logo]')?.remove()
})

describe('BootSplash', () => {
  it('exibe a marca Kadu e o subtítulo em fundo claro', () => {
    render(<BootSplash />)

    expect(screen.getByRole('status', { name: /Carregando Kadu/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveClass('bg-industrial-50')
    expect(screen.getByText('Kadu')).toBeInTheDocument()
    expect(screen.getByText('Vistoria Técnica')).toBeInTheDocument()
  })

  it('fica transparente e some o texto quando fading', () => {
    render(<BootSplash fading />)
    const status = screen.getByRole('status')

    expect(status).toHaveAttribute('data-fading', 'true')
    expect(status).toHaveClass('bg-transparent')
    expect(screen.getByText('Kadu').parentElement).toHaveClass('opacity-0')
  })

  it('usa rounded-xl padronizado no logo', () => {
    const { container } = render(<BootSplash />)
    expect(container.querySelector('img')).toHaveClass('rounded-xl')
  })

  it('aplica classes de animação quando animate e pulse', () => {
    const { container } = render(<BootSplash animate pulse />)
    const img = container.querySelector('img')

    expect(img).toHaveClass('animate-boot-splash-in')
    expect(img).toHaveClass('animate-boot-splash-pulse')
  })

  it('anima left/top/width até o slot do login quando fading', () => {
    const target = document.createElement('img')
    target.setAttribute('data-login-logo', '')
    Object.defineProperty(target, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        top: 80,
        width: 48,
        height: 48,
        right: 148,
        bottom: 128,
        x: 100,
        y: 80,
        toJSON: () => ({}),
      }),
    })
    document.body.appendChild(target)

    const { container, rerender } = render(<BootSplash />)
    const img = container.querySelector('img')!
    Object.defineProperty(img, 'getBoundingClientRect', {
      value: () => ({
        left: 200,
        top: 300,
        width: 72,
        height: 72,
        right: 272,
        bottom: 372,
        x: 200,
        y: 300,
        toJSON: () => ({}),
      }),
    })

    act(() => {
      rerender(<BootSplash fading />)
    })

    expect(img.style.position).toBe('fixed')
    expect(img.style.left).toBe('100px')
    expect(img.style.top).toBe('80px')
    expect(img.style.width).toBe('48px')
    expect(img.style.height).toBe('48px')
  })
})
