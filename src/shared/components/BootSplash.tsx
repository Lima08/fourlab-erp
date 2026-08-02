import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  BOOT_LOGO_RADIUS_CLASS,
  BOOT_SPLASH_EASE,
  BOOT_SPLASH_FADE_MS,
  BOOT_SPLASH_HANDOFF_MS,
  LOGIN_LOGO_SELECTOR,
} from '@/shared/constants/bootSplash'

interface Props {
  /** Transição de saída: logo voa até o slot do login (se existir). */
  fading?: boolean
  /** Logo do login já revelado por baixo — dissolve o do splash. */
  logoLanded?: boolean
  /** Entrada animada (só no brand moment de abertura). */
  animate?: boolean
  /** Pulse suave no logo enquanto aguarda. */
  pulse?: boolean
  className?: string
}

function resetLogoStyles(logo: HTMLImageElement) {
  logo.style.position = ''
  logo.style.left = ''
  logo.style.top = ''
  logo.style.width = ''
  logo.style.height = ''
  logo.style.margin = ''
  logo.style.transform = ''
  logo.style.opacity = ''
  logo.style.transition = ''
  logo.style.zIndex = ''
}

function flyLogoToLogin(logo: HTMLImageElement) {
  const target = document.querySelector<HTMLElement>(LOGIN_LOGO_SELECTOR)
  const duration = `${BOOT_SPLASH_FADE_MS}ms`
  const ease = BOOT_SPLASH_EASE

  const from = logo.getBoundingClientRect()

  // Congela na viewport — anima left/top/width/height (raio fica constante)
  logo.style.position = 'fixed'
  logo.style.left = `${from.left}px`
  logo.style.top = `${from.top}px`
  logo.style.width = `${from.width}px`
  logo.style.height = `${from.height}px`
  logo.style.margin = '0'
  logo.style.zIndex = '10000'
  logo.style.opacity = '1'
  logo.style.transform = 'none'
  void logo.offsetWidth

  if (!target) {
    logo.style.transition = [
      `top ${duration} ${ease}`,
      `width ${duration} ${ease}`,
      `height ${duration} ${ease}`,
      `opacity ${duration} ${ease}`,
    ].join(', ')
    logo.style.top = `${from.top - 28}px`
    logo.style.width = `${from.width * 0.92}px`
    logo.style.height = `${from.height * 0.92}px`
    logo.style.opacity = '0'
    return
  }

  const to = target.getBoundingClientRect()

  logo.style.transition = [
    `left ${duration} ${ease}`,
    `top ${duration} ${ease}`,
    `width ${duration} ${ease}`,
    `height ${duration} ${ease}`,
  ].join(', ')
  logo.style.left = `${to.left}px`
  logo.style.top = `${to.top}px`
  logo.style.width = `${to.width}px`
  logo.style.height = `${to.height}px`
}

export function BootSplash({
  fading = false,
  logoLanded = false,
  animate = false,
  pulse = false,
  className,
}: Props) {
  const logoRef = useRef<HTMLImageElement>(null)

  useLayoutEffect(() => {
    const logo = logoRef.current
    if (!logo) return

    if (!fading) {
      resetLogoStyles(logo)
      return
    }

    flyLogoToLogin(logo)
  }, [fading])

  useLayoutEffect(() => {
    const logo = logoRef.current
    if (!logo || !logoLanded) return

    logo.style.transition = `opacity ${BOOT_SPLASH_HANDOFF_MS}ms ease-out`
    logo.style.opacity = '0'
  }, [logoLanded])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando Kadu"
      data-fading={fading ? 'true' : undefined}
      className={cn(
        'fixed inset-0 z-9999 flex flex-col items-center justify-center gap-5',
        'transition-colors duration-500 ease-out',
        fading ? 'pointer-events-none bg-transparent' : 'bg-industrial-50',
        className,
      )}
    >
      <img
        ref={logoRef}
        src="/icons/icon-192.png"
        alt=""
        width={72}
        height={72}
        className={cn(
          'size-[72px] object-cover shadow-sm',
          BOOT_LOGO_RADIUS_CLASS,
          'will-change-[left,top,width,height]',
          animate && !fading && 'animate-boot-splash-in',
          pulse && !fading && 'animate-boot-splash-pulse',
        )}
      />
      <div
        className={cn(
          'text-center text-industrial-900 transition-all duration-500 ease-out',
          animate && !fading && 'animate-boot-splash-in [animation-delay:80ms]',
          fading ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
        )}
      >
        <p className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">Kadu</p>
        <p className="mt-1.5 m-0 text-xs font-bold uppercase tracking-[0.14em] text-industrial-500">
          Vistoria Técnica
        </p>
      </div>
    </div>
  )
}
