export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

export function matchesSearchText(haystack: string, needle: string): boolean {
  const normalizedNeedle = normalizeSearchText(needle)
  if (!normalizedNeedle) return true
  return normalizeSearchText(haystack).includes(normalizedNeedle)
}
