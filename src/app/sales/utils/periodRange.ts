export type PeriodPreset = 'month' | 'quarter' | 'year' | 'custom'

export interface PeriodRange {
  from: string
  to: string
}

export interface GetPeriodRangeOptions {
  preset?: PeriodPreset
  from?: string
  to?: string
  /** ISO date `YYYY-MM-DD` used as reference for presets. Defaults to today. */
  today?: string
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function resolveToday(today?: string): Date {
  if (today) return parseIsoDate(today)
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function getPeriodRange(options: GetPeriodRangeOptions = {}): PeriodRange {
  const preset = options.preset ?? 'month'
  const today = resolveToday(options.today)

  if (preset === 'custom') {
    if (!options.from || !options.to) {
      throw new Error('Custom period requires from and to')
    }
    return { from: options.from, to: options.to }
  }

  const year = today.getFullYear()
  const monthIndex = today.getMonth()

  if (preset === 'month') {
    return {
      from: toIsoDate(year, monthIndex, 1),
      to: toIsoDate(year, monthIndex, lastDayOfMonth(year, monthIndex)),
    }
  }

  if (preset === 'quarter') {
    const quarterStartMonth = Math.floor(monthIndex / 3) * 3
    const quarterEndMonth = quarterStartMonth + 2
    return {
      from: toIsoDate(year, quarterStartMonth, 1),
      to: toIsoDate(year, quarterEndMonth, lastDayOfMonth(year, quarterEndMonth)),
    }
  }

  return {
    from: toIsoDate(year, 0, 1),
    to: toIsoDate(year, 11, 31),
  }
}
