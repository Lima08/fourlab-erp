export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`

  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)

  if (rest.length <= 4) return `(${ddd}) ${rest}`

  const splitAt = digits.length > 10 ? 5 : 4
  return `(${ddd}) ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`
}
