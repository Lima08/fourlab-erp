import type { ChangeEvent, FocusEventHandler } from 'react'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { INPUT_CLS, LABEL_CLS } from '@/plataforma/constants/addProject'

interface Option {
  value: string
  label: string
}

interface Props {
  id: string
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: 'text' | 'number' | 'select'
  error?: string
  onBlur?: FocusEventHandler<HTMLInputElement>
  min?: string
  step?: string
  labelCls?: string
  inputCls?: string
  options?: Option[]
  placeholder?: string
  className?: string
}

export function FormField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  error,
  onBlur,
  min,
  step,
  labelCls = LABEL_CLS,
  inputCls = INPUT_CLS,
  options,
  placeholder,
  className,
}: Props) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {type === 'select' ? (
        <div className="relative">
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputCls} appearance-none pr-10`}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Icon name="expand_more" className="text-industrial-400" />
          </div>
        </div>
      ) : (
        <input
          id={id}
          type={type}
          min={min}
          step={step}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={onBlur}
          className={inputCls}
        />
      )}
      <p className="min-h-4 text-xs text-red-600">{error}</p>
    </div>
  )
}
