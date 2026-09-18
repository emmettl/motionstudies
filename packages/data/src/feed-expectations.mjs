import { readOperationalTime } from './feed-observability.mjs'

const shift = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10)
function formatter(timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}
function wall(format, ms) {
  const p = Object.fromEntries(format.formatToParts(ms).map(p => [p.type, p.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}
/** Latest occurrence of a repeated local minute; first valid minute after a DST gap. */
function deadlineAt(date, deadline, format) {
  const target = `${date}T${deadline}`, nominal = Date.parse(`${target}:00Z`)
  let exact = null, next = null
  for (let ms = nominal - 18 * 3600000; ms <= nominal + 18 * 3600000; ms += 60000) {
    const local = wall(format, ms)
    if (local === target) exact = ms
    if (local.slice(0, 10) === date && local > target && (!next || local < next.local)) next = { local, ms }
  }
  const value = exact ?? next?.ms
  if (value === undefined) throw new Error('Local deadline does not exist on this date')
  return value
}
/** Latest completed service date whose following-day deadline has passed. */
export function dailyFeedExpectation({ timeZone, deadline }, now = Date.now()) {
  if (typeof timeZone !== 'string' || timeZone.length > 80 || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(deadline)) throw new Error('Invalid daily expectation')
  readOperationalTime(new Date(now).toISOString())
  const format = formatter(timeZone), today = wall(format, now).slice(0, 10)
  const todayDeadline = deadlineAt(today, deadline, format), dueToday = now >= todayDeadline
  const dueDate = dueToday ? today : shift(today, -1)
  return { serviceDate: shift(dueDate, -1), deadlineAt: new Date(dueToday ? todayDeadline : deadlineAt(dueDate, deadline, format)).toISOString(),
    nextDeadlineAt: new Date(dueToday ? deadlineAt(shift(today, 1), deadline, format) : todayDeadline).toISOString() }
}
