import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2Icon } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import type { ClientSummary } from '@/shared/services/clientAdminService'
import { matchesSearchText } from '@/shared/utils/normalizeSearchText'

interface Props {
  id: string
  clients: ClientSummary[]
  value?: string
  onChange: (clientId: string) => void
  disabled?: boolean
  loading?: boolean
  error?: string
  loadError?: string
  emptyMessage?: string
}

interface PopupPosition {
  top: number
  left: number
  width: number
  maxHeight: number
  openUp: boolean
}

const TRIGGER_CLS =
  'flex h-12 w-full items-center justify-between rounded-lg border border-industrial-200 bg-white px-4 text-base text-industrial-900 outline-none transition-all focus:border-safety-blue focus:ring-1 focus:ring-safety-blue disabled:cursor-not-allowed disabled:bg-industrial-50 disabled:text-industrial-400'

const POPUP_ESTIMATED_HEIGHT = 320

function computePopupPosition(trigger: HTMLElement): PopupPosition {
  const rect = trigger.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - 8
  const spaceAbove = rect.top - 8
  const openUp = spaceBelow < POPUP_ESTIMATED_HEIGHT && spaceAbove > spaceBelow

  if (openUp) {
    return {
      top: rect.top - 4,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(280, spaceAbove),
      openUp: true,
    }
  }

  return {
    top: rect.bottom + 4,
    left: rect.left,
    width: rect.width,
    maxHeight: Math.min(280, spaceBelow),
    openUp: false,
  }
}

export function ClientCombobox({
  id,
  clients,
  value,
  onChange,
  disabled = false,
  loading = false,
  error,
  loadError,
  emptyMessage = 'Nenhum cliente cadastrado. Cadastre um cliente antes de convidar usuários.',
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null)

  const selectedClient = clients.find((client) => client.id === value)

  const filteredClients = useMemo(() => {
    return clients.filter((client) => matchesSearchText(client.name, search))
  }, [clients, search])

  const isDisabled = disabled || loading || Boolean(loadError) || clients.length === 0

  const updatePopupPosition = useCallback(() => {
    if (!triggerRef.current) return
    setPopupPosition(computePopupPosition(triggerRef.current))
  }, [])

  const closePopup = useCallback(() => {
    setOpen(false)
    setSearch('')
    setPopupPosition(null)
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePopupPosition()
  }, [open, updatePopupPosition])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return
      closePopup()
    }

    const handleScroll = () => updatePopupPosition()

    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', updatePopupPosition)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', updatePopupPosition)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, closePopup, updatePopupPosition])

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus()
    }
  }, [open, popupPosition])

  const handleSelect = (clientId: string) => {
    onChange(clientId)
    closePopup()
  }

  const handleToggle = () => {
    if (isDisabled) return
    if (open) {
      closePopup()
      return
    }
    setOpen(true)
  }

  const popup =
    open && !isDisabled && popupPosition
      ? createPortal(
          <div
            ref={popupRef}
            style={{
              position: 'fixed',
              top: popupPosition.top,
              left: popupPosition.left,
              width: popupPosition.width,
              transform: popupPosition.openUp ? 'translateY(-100%)' : undefined,
              zIndex: 100,
            }}
            className="border-industrial-200 overflow-hidden rounded-lg border-2 bg-white shadow-lg"
            onWheel={(event) => event.stopPropagation()}
          >
            <div className="border-industrial-200 border-b p-2">
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente..."
                className="border-industrial-200 h-10 w-full rounded-md border px-3 text-sm text-industrial-900 outline-none focus:border-safety-blue focus:ring-1 focus:ring-safety-blue"
                aria-label="Buscar cliente"
              />
            </div>

            <ul
              role="listbox"
              aria-labelledby={id}
              className="overflow-y-auto overscroll-contain p-1"
              style={{ maxHeight: popupPosition.maxHeight - 56 }}
            >
              {filteredClients.length === 0 ? (
                <li className="text-industrial-500 px-3 py-2 text-sm">Nenhum cliente encontrado</li>
              ) : (
                filteredClients.map((client) => (
                  <li key={client.id} role="option" aria-selected={client.id === value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(client.id)}
                      className={cn(
                        'flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-semibold text-industrial-700 transition-colors hover:bg-industrial-100',
                        client.id === value && 'bg-industrial-100 text-industrial-900'
                      )}
                    >
                      {client.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body
        )
      : null

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isDisabled}
        onClick={handleToggle}
        className={cn(TRIGGER_CLS, !selectedClient && 'text-industrial-400')}
      >
        <span className="truncate">
          {loading ? 'Carregando clientes...' : (selectedClient?.name ?? 'Selecione um cliente')}
        </span>
        {loading ? (
          <Loader2Icon className="size-4 shrink-0 animate-spin text-industrial-400" />
        ) : (
          <Icon name="expand_more" className="text-industrial-400 shrink-0" />
        )}
      </button>

      {popup}

      {loadError && <p className="mt-1 text-xs text-red-600">{loadError}</p>}
      {!loadError && clients.length === 0 && !loading && (
        <p className="text-industrial-500 mt-1 text-xs">{emptyMessage}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
