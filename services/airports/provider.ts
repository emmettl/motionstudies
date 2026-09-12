import type { LiveAirportMovement, LiveAirportSnapshot } from '@motionstudies/core/domain/live-airport'
import type { AirportConfig, FeedConfig } from './config.ts'
type ObjectValue = Record<string, unknown>
const object = (v: unknown): ObjectValue => v && typeof v === 'object' && !Array.isArray(v) ? v as ObjectValue : {}
const text = (v: unknown) => typeof v === 'string' && v.trim() ? v.trim() : undefined
function instant(v: unknown) {
  const utc = text(object(v).utc)
  if (!utc || !/(Z|[+-]\d\d:\d\d)$/.test(utc)) return undefined
  const n = Date.parse(utc.replace(' ', 'T')) / 1000
  return Number.isFinite(n) ? n : undefined
}
const statuses: Record<string, string> = { Expected: 'Expected', EnRoute: 'En route', CheckIn: 'Check-in', Boarding: 'Boarding', GateClosed: 'Gate closed', Departed: 'Departed', Delayed: 'Delayed', Approaching: 'Approach', Arrived: 'Arrived', Canceled: 'Cancelled', Diverted: 'Diverted', CanceledUncertain: 'Uncertain' }
export function normalizeBoard(payload: unknown, airport: AirportConfig, now: number, config: Pick<FeedConfig, 'refreshSeconds' | 'staleSeconds'>): LiveAirportSnapshot {
  const data = object(payload)
  if (!('departures' in data) || !('arrivals' in data)
    || (data.departures !== null && !Array.isArray(data.departures)) || (data.arrivals !== null && !Array.isArray(data.arrivals))) throw new Error('Invalid provider board')
  function rows(direction: 'departures' | 'arrivals'): LiveAirportMovement[] {
    const unique = new Map<string, LiveAirportMovement>()
    for (const item of (data[direction] ?? []) as unknown[]) {
      const f = object(item), local = object(f[direction === 'departures' ? 'departure' : 'arrival'])
      const opposite = object(object(f[direction === 'departures' ? 'arrival' : 'departure']).airport)
      const service = text(f.number), scheduledTime = instant(local.scheduledTime), revisedTime = instant(local.revisedTime)
      // Scheduled time anchors identity across revisions; incomplete identities are omitted.
      if (!service || scheduledTime === undefined) continue
      const id = `${airport.iata}:${direction}:${service}:${scheduledTime}`
      const status = typeof f.status === 'string' ? statuses[f.status] : undefined
      unique.set(id, { id, service, scheduledTime, revisedTime, place: text(opposite.name) ?? text(opposite.iata), gate: text(local.gate), status,
        tone: ['Delayed', 'Canceled', 'Diverted', 'CanceledUncertain'].includes(String(f.status)) ? 'warning' : f.status === 'Boarding' ? 'accent' : 'neutral' })
    }
    return [...unique.values()].sort((a, b) => (a.revisedTime ?? a.scheduledTime!) - (b.revisedTime ?? b.scheduledTime!))
  }
  return { airport, fetchedAt: now, freshUntil: now + config.refreshSeconds, expiresAt: now + config.staleSeconds,
    windowStart: now - 3600, windowEnd: now + 7200, departures: rows('departures'), arrivals: rows('arrivals') }
}
export class ProviderError extends Error {
  constructor(readonly status: number, readonly retrySeconds = 300) { super('Airport provider unavailable') }
}
export async function fetchAirport(airport: AirportConfig, key: string, config: FeedConfig, now: number, fetcher: typeof fetch = (input, init) => fetch(input, init)) {
  const url = new URL(`https://api.aerodatabox.com/flights/airports/iata/${airport.iata}`)
  url.search = new URLSearchParams({ offsetMinutes: '-60', durationMinutes: '180', direction: 'Both', withLeg: 'true', withCodeshared: 'false', withCargo: 'false', withPrivate: 'false', withLocation: 'false' }).toString()
  const response = await fetcher(url.toString(), { headers: { 'X-Api-Key': key, Accept: 'application/json' }, redirect: 'manual', signal: AbortSignal.timeout(15000) })
  if (!response.ok) {
    const retry = response.headers.get('retry-after')
    const seconds = retry ? (/^\d+$/.test(retry) ? Number(retry) : Date.parse(retry) / 1000 - now) : 300
    throw new ProviderError(response.status, Number.isFinite(seconds) ? Math.max(300, Math.min(86400, seconds)) : 300)
  }
  // No provider error bodies or headers are passed to clients or logs.
  return normalizeBoard(await response.json(), airport, now, config)
}
