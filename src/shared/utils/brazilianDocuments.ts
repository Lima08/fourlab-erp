export function stripDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

function isRepeatedDigitSequence(digits: string): boolean {
  return /^(\d)\1+$/.test(digits)
}

function calcCpfCheckDigit(digits: string, length: number): number {
  let sum = 0
  for (let i = 0; i < length; i++) {
    sum += Number(digits[i]) * (length + 1 - i)
  }
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

export function isValidCpf(value: string): boolean {
  const digits = stripDigits(value)
  if (digits.length !== 11 || isRepeatedDigitSequence(digits)) {
    return false
  }

  const firstCheck = calcCpfCheckDigit(digits, 9)
  const secondCheck = calcCpfCheckDigit(digits, 10)

  return firstCheck === Number(digits[9]) && secondCheck === Number(digits[10])
}

function calcCnpjCheckDigit(digits: string, weights: number[]): number {
  let sum = 0
  for (let i = 0; i < weights.length; i++) {
    sum += Number(digits[i]) * (weights[i] ?? 0)
  }
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

export function isValidCnpj(value: string): boolean {
  const digits = stripDigits(value)
  if (digits.length !== 14 || isRepeatedDigitSequence(digits)) {
    return false
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const firstCheck = calcCnpjCheckDigit(digits, firstWeights)
  const secondCheck = calcCnpjCheckDigit(digits, secondWeights)

  return firstCheck === Number(digits[12]) && secondCheck === Number(digits[13])
}

export function formatCpf(value: string): string {
  const digits = stripDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function formatCnpj(value: string): string {
  const digits = stripDigits(value).slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function formatDocument(value: string, type: 'pf' | 'pj'): string {
  return type === 'pf' ? formatCpf(value) : formatCnpj(value)
}

export function formatPhone(value: string): string {
  const digits = stripDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function formatCep(value: string): string {
  const digits = stripDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}
