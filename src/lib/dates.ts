/** Fuso do negócio. O Brasil não tem horário de verão desde 2019, então o offset é fixo. */
export const TZ = 'America/Sao_Paulo'
const OFFSET = '-03:00'

/** "2026-11-05" no fuso do negócio */
export function dayKey(d: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

/** Data + hora locais (fuso do negócio) → instante UTC */
export function zonedDate(day: string, time = '00:00') {
  return new Date(`${day}T${time}:00${OFFSET}`)
}

export function addDays(day: string, n: number) {
  const d = zonedDate(day, '12:00')
  d.setUTCDate(d.getUTCDate() + n)
  return dayKey(d)
}

export function dayRange(day: string) {
  return { start: zonedDate(day), end: zonedDate(addDays(day, 1)) }
}

export const fmtTime = (d: Date) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d)

export const fmtDay = (day: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: '2-digit', month: 'long' }) => {
  const s = new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, ...opts }).format(zonedDate(day, '12:00'))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export const fmtDate = (d: Date) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)

export const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Segunda-feira da semana do dia informado */
export function weekStart(day: string) {
  const wd = zonedDate(day, '12:00').getUTCDay()
  return addDays(day, wd === 0 ? -6 : 1 - wd)
}
