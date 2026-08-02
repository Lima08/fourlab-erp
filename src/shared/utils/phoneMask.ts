/** Remove non-digits from phone input. */
export function stripPhone(value: string): string {
  return value.replace(/\D/g, '')
}

/** Apply progressive BR phone mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX. */
export function formatPhoneInput(value: string): string {
  const digits = stripPhone(value).slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** Validate BR phone: 10 digits (landline) or 11 digits (mobile). */
export function isValidBrPhone(value: string): boolean {
  const digits = stripPhone(value)
  return digits.length === 10 || digits.length === 11
}
