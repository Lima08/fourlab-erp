import type { FocusEventHandler } from 'react'
import { cn } from '@/lib/utils'
import { FormField } from './FormField'

interface Option {
  value: string
  label: string
}

export interface StepField {
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
  span?: 'full' | 'half'
}

interface StepFormProps {
  fields: StepField[]
  onSubmit: React.FormEventHandler<HTMLFormElement>
  footer: React.ReactNode
  layout?: 'stack' | 'grid'
}

export function StepForm({ fields, onSubmit, footer, layout = 'stack' }: StepFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col">
      <div
        className={cn(
          'flex-1 overflow-y-auto p-6',
          layout === 'grid' ? 'grid grid-cols-2 gap-x-4 gap-y-1' : 'space-y-4'
        )}
      >
        {fields.map((field) => (
          <FormField
            key={field.id}
            {...field}
            className={layout === 'grid' && field.span !== 'full' ? undefined : 'col-span-2'}
          />
        ))}
      </div>

      <div className=" rounded-b-xl border-industrial-200 bg-industrial-50 flex shrink-0 flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">
        {footer}
      </div>
    </form>
  )
}
