const TIMEZONE = 'Europe/London'

export function checkedDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '') || !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) ||
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error('An actual service date in YYYY-MM-DD form is required')
  }
  return value
}

// UK midnight is unambiguous on both DST transition days. Never infer a full day as 86400 seconds.
function londonMidnight(date) {
  const nominal = Date.parse(`${date}T00:00:00Z`)
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, timeZoneName: 'longOffset' })
  let instant = nominal
  for (let attempt = 0; attempt < 3; attempt++) {
    const offset = formatter.formatToParts(instant).find(part => part.type === 'timeZoneName').value
    const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(offset)
    if (offset !== 'GMT' && !match) throw new Error('Unsupported timezone offset')
    const minutes = match ? (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3])) : 0
    instant = nominal - minutes * 60000
  }
  return instant
}

export function studyDay(serviceDate) {
  checkedDate(serviceDate)
  const next = new Date(Date.parse(`${serviceDate}T00:00:00Z`) + 86400000).toISOString().slice(0, 10)
  const start = londonMidnight(serviceDate)
  const end = londonMidnight(next)
  return { serviceDate, timezone: TIMEZONE, startUtc: new Date(start).toISOString(), endUtc: new Date(end).toISOString(), durationSeconds: (end - start) / 1000 }
}

export function utcDatesForDay(day) {
  const first = Date.parse(day.startUtc.slice(0, 10))
  const last = Date.parse(new Date(Date.parse(day.endUtc) - 1).toISOString().slice(0, 10))
  const dates = []
  for (let time = first; time <= last; time += 86400000) dates.push(new Date(time).toISOString().slice(0, 10))
  return dates
}

// GTFS defines service time from local noon minus twelve elapsed hours. On UK
// DST transition days this differs from the observed civil-day midnight.
export function gtfsServiceInstant(serviceDate, seconds) {
  if (!Number.isSafeInteger(seconds) || seconds < 0) throw new Error('GTFS seconds must be a nonnegative whole number')
  const day = studyDay(serviceDate)
  const noonMinusTwelveHours = Date.parse(day.endUtc) - 86400000
  return new Date(noonMinusTwelveHours + seconds * 1000).toISOString()
}
