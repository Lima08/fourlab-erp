import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { STEPS } from '@/plataforma/constants/addProject'

interface StepHeaderProps {
  step: 1 | 2 | 3 | 4
}
export function StepHeader({ step }: StepHeaderProps) {
  return (
    <div className="border-industrial-200 overflow-hidden border-b px-6 py-3">
      <div className="flex items-center gap-2 transition-transform duration-300 ease-in-out">
        {STEPS.map((s, index) => (
          <div key={s.id} className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  step > s.id
                    ? 'bg-green-600 text-white'
                    : step === s.id
                      ? 'bg-industrial-950 text-white'
                      : 'bg-industrial-100 text-industrial-400'
                )}
              >
                {step > s.id ? <Icon name="check" className="text-[14px]" /> : s.id}
              </span>

              <span
                className={cn(
                  'text-xs font-semibold whitespace-nowrap',
                  step > s.id ? 'text-green-600' : 'text-industrial-900'
                )}
              >
                {s.id === step && s.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-12 rounded-full',
                  step > s.id ? 'bg-green-600' : 'bg-industrial-200'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
