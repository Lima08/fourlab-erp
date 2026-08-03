export function parseSearchAmount(term: string): number | null {
  const trimmed = term.trim()
  if (!trimmed) return null

  // Strip currency symbol and spaces
  let normalized = trimmed.replace(/R\$\s?/gi, '').replace(/\s/g, '')

  // BR format: 1.500,50 → 1500.50
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(normalized)) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (normalized.includes(',') && !normalized.includes('.')) {
    normalized = normalized.replace(',', '.')
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return null
  }

  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

export function formatBrl(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
