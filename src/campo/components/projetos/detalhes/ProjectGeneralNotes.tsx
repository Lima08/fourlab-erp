import { Icon } from '@/components/ui/icon'

interface Props {
  notes: string
}

export function ProjectGeneralNotes({ notes }: Props) {
  if (!notes) return null

  return (
    <section className="border-industrial-200 rounded-2xl border bg-white p-6 shadow-sm">
      <h3 className="text-industrial-900 mb-4 flex items-center gap-2 text-lg font-semibold">
        <Icon name="notes" className="text-safety-blue text-[22px]" />
        Observações Gerais
      </h3>
      <div className="border-industrial-200 bg-industrial-50 max-h-32 overflow-y-auto rounded-xl border p-4">
        <p className="text-industrial-600 text-sm leading-relaxed">{notes}</p>
      </div>
    </section>
  )
}
