import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/icon'

interface Props {
  onSearchChange: (search: string) => void
}

export function UsersSearchBar({ onSearchChange }: Props) {
  const [text, setText] = useState('')
  const onSearchChangeRef = useRef(onSearchChange)

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange
  }, [onSearchChange])

  useEffect(() => {
    const timer = setTimeout(() => onSearchChangeRef.current(text), 300)
    return () => clearTimeout(timer)
  }, [text])

  return (
    <>
      <label className="sr-only" htmlFor="usuarios-search">
        Buscar usuários
      </label>
      <div className="relative">
        <Icon
          name="search"
          className="text-industrial-400 pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[20px]"
        />
        <input
          id="usuarios-search"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Buscar por nome, e-mail ou função..."
          className="border-industrial-200 text-industrial-900 placeholder:text-industrial-400 focus:border-safety-blue focus:ring-safety-blue h-12 w-full rounded-xl border bg-white pr-4 pl-11 text-sm shadow-sm transition-all outline-none focus:ring-1"
        />
      </div>
    </>
  )
}
