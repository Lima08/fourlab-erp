import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { LABEL_CLS } from '@/plataforma/constants/addProject'
import type { ProjectDocumentType } from '@/plataforma/services/projectService'

interface UploadTypeOption {
  id: ProjectDocumentType
  icon: string
  title: string
  subtitle: string
}

interface Props {
  label: string
  options: UploadTypeOption[]
  value: ProjectDocumentType | null
  onChange: (value: ProjectDocumentType) => void
}

export function UploadFileSelectType({ label, options, value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <span className={LABEL_CLS}>{label}</span>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={value === option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border-2 p-4 text-center transition',
              value === option.id
                ? 'border-industrial-950 bg-industrial-950/5'
                : 'border-industrial-200 hover:border-industrial-400 bg-white'
            )}
          >
            <Icon name={option.icon} className="text-industrial-700 text-[28px]" />
            <span className="text-industrial-900 text-sm font-bold">{option.title}</span>
            <span className="text-industrial-500 text-xs">{option.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
