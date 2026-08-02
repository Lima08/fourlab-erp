import { cn } from '@/lib/utils'

interface Props {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}

export function CircularProgress({ value, size = 96, strokeWidth = 8, label, className }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedValue = Math.min(100, Math.max(0, value))
  const offset = circumference * (1 - clampedValue / 100)

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-industrial-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-safety-blue transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-industrial-900 text-2xl font-extrabold tabular-nums">
          {clampedValue}%
        </span>
        {label ? (
          <span className="text-industrial-400 mt-0.5 text-[10px] font-extrabold tracking-wide uppercase">
            {label}
          </span>
        ) : null}
      </div>
    </div>
  )
}
