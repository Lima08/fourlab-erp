import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { LABEL_CLS } from '@/plataforma/constants/addProject'

interface Props {
  id: string
  label: string
  accept: string
  disabled?: boolean
  disabledMessage?: string
  placeholder: string
  file: File | null
  fileIcon?: string
  onAdd: (files: File[]) => void
  onRemove: () => void
}

export function UploadFileInput({
  id,
  label,
  accept,
  disabled = false,
  disabledMessage,
  placeholder,
  file,
  fileIcon = 'picture_as_pdf',
  onAdd,
  onRemove,
}: Props) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={LABEL_CLS}>
        {label}
      </label>
      <label
        htmlFor={id}
        className={cn(
          'flex flex-col items-center gap-2 rounded-lg border-2 border-dashed bg-white px-4 py-8 text-center transition',
          !disabled
            ? 'border-industrial-200 hover:border-industrial-400 cursor-pointer'
            : 'border-industrial-100 bg-industrial-50 cursor-not-allowed opacity-60'
        )}
      >
        <Icon name="upload_file" className="text-industrial-400 text-[28px]" />
        <span className="text-industrial-600 text-sm font-medium">
          {disabled ? disabledMessage : placeholder}
        </span>
      </label>

      <input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          onAdd(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />

      {file && (
        <ul className="space-y-2">
          <li className="border-industrial-200 flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
            <Icon name={fileIcon} className="text-industrial-400 text-[20px]" />
            <span className="text-industrial-700 flex-1 truncate text-sm">{file.name}</span>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remover ${file.name}`}
              className="text-industrial-400 hover:text-industrial-700"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
