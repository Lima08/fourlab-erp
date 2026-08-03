const TIME_ZONE = 'America/Sao_Paulo'

const MONTH_LABELS_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function parseIsoDateParts(isoDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = isoDate.split('-').map(Number)
  return { year: year!, month: month!, day: day! }
}

/** Calendar date `YYYY-MM-DD` in America/Sao_Paulo for the given instant. */
export function getBrazilTodayIso(reference: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(reference)

  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Failed to resolve America/Sao_Paulo calendar date')
  }

  return `${year}-${month}-${day}`
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export interface BrazilMonthBounds {
  start: string
  end: string
  monthKey: string
}

/** Inclusive civil-month bounds in America/Sao_Paulo. */
export function getBrazilMonthBounds(reference: Date = new Date()): BrazilMonthBounds {
  const { year, month } = parseIsoDateParts(getBrazilTodayIso(reference))
  const monthKey = `${year}-${pad2(month)}`
  return {
    start: `${monthKey}-01`,
    end: `${monthKey}-${pad2(lastDayOfMonth(year, month))}`,
    monthKey,
  }
}

export interface BrazilMonthBucket {
  monthKey: string
  label: string
  start: string
  end: string
}

/** Last `count` civil months ending at the current SP month (oldest → newest). */
export function listBrazilMonths(count: number, reference: Date = new Date()): BrazilMonthBucket[] {
  if (count < 1) return []

  const { year, month } = parseIsoDateParts(getBrazilTodayIso(reference))
  const buckets: BrazilMonthBucket[] = []

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1))
    const y = date.getUTCFullYear()
    const m = date.getUTCMonth() + 1
    const monthKey = `${y}-${pad2(m)}`
    buckets.push({
      monthKey,
      label: `${MONTH_LABELS_PT[m - 1]}/${y}`,
      start: `${monthKey}-01`,
      end: `${monthKey}-${pad2(lastDayOfMonth(y, m))}`,
    })
  }

  return buckets
}

export function isIsoDateBefore(a: string, b: string): boolean {
  return a < b
}
