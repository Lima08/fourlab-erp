import { Icon } from '@/components/ui/icon'

interface Props {
  onBack: () => void
}

export function ProjectDetailTopBar({ onBack }: Props) {
  return (
    <header className="border-industrial-200 bg-surface sticky top-0 z-50 flex h-16 w-full items-center justify-center border-b px-4">
      <button
        onClick={onBack}
        className="text-industrial-700 hover:bg-industrial-100 absolute left-4 flex size-12 items-center justify-center rounded-full transition-all active:scale-95"
        aria-label="Voltar"
      >
        <Icon name="arrow_back" className="text-[24px]" />
      </button>

      <h1 className="text-industrial-900 text-lg font-bold">Detalhes do Projeto</h1>
    </header>
  )
}
