export function parseBRL(value: string): number {
  const cleaned = value.trim().replace(/[^\d,.-]/g, '')
  if (cleaned.length === 0) return 0

  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')

  let normalized: string
  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.')
  } else {
    normalized = cleaned
  }

  const n = Number.parseFloat(normalized)
  return Number.isFinite(n) ? n : 0
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function numberToBRL(n: number): string {
  if (!Number.isFinite(n)) return '0,00'
  return n.toFixed(2).replace('.', ',')
}

export function quantityToBRL(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toString().replace('.', ',')
}
