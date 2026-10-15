// Dates are stored as local calendar days in YYYY-MM-DD form so a habit
// logged "today" stays on the same day wherever the math happens.

export type DateKey = string

export function toKey(d: Date): DateKey {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(now: Date = new Date()): DateKey {
  return toKey(now)
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

/** 0 = Sunday … 6 = Saturday, matching Date#getDay. */
export function weekday(key: DateKey): number {
  return fromKey(key).getDay()
}

/** Monday that starts the week containing `key`. */
export function weekStart(key: DateKey): DateKey {
  const wd = weekday(key)
  return addDays(key, wd === 0 ? -6 : 1 - wd)
}

export function weekDays(key: DateKey): DateKey[] {
  const start = weekStart(key)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function daysBetween(from: DateKey, to: DateKey): DateKey[] {
  const out: DateKey[] = []
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k)
  return out
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/** Display order for weekday pickers: Monday first. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function prettyDate(key: DateKey): string {
  return fromKey(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
