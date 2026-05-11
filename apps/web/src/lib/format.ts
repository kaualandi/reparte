const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(value: number | string): string {
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace('.', '').replace(',', '.'))
  return brl.format(Number.isFinite(n) ? n : 0)
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function formatDateTime(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return dateFmt.format(d)
}
