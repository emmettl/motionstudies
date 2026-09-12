/** Live boards use Unix seconds throughout, independent of an edition's recorded service day. */
export interface LiveAirportMovement {
  readonly id: string
  readonly service: string
  readonly scheduledTime?: number
  /** Provider revision: may be estimated or actual; do not relabel as confirmed. */
  readonly revisedTime?: number
  readonly place?: string
  readonly gate?: string
  readonly status?: string
  readonly tone?: 'neutral' | 'accent' | 'warning'
}
export interface LiveAirportSnapshot {
  readonly airport: { readonly iata: string; readonly name: string; readonly city: string; readonly timeZone: string }
  readonly fetchedAt: number
  readonly freshUntil: number
  readonly expiresAt: number
  readonly windowStart: number
  readonly windowEnd: number
  readonly departures: readonly LiveAirportMovement[]
  readonly arrivals: readonly LiveAirportMovement[]
}
export type AirportFeedReason = 'disabled' | 'not-configured' | 'subscription' | 'budget' | 'provider' | 'rate-limit'
export interface AirportFeedResponse {
  readonly version: 1
  readonly status: 'fresh' | 'stale' | 'unavailable' | 'disabled'
  readonly reason?: AirportFeedReason
  readonly retryAfterSeconds: number
  readonly snapshot?: LiveAirportSnapshot
}
export interface AirportFeedCapabilities {
  readonly version: 1
  readonly enabled: boolean
  readonly airports: readonly string[]
}
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object'
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
function movement(value: unknown): value is LiveAirportMovement {
  return record(value) && typeof value.id === 'string' && typeof value.service === 'string'
    && ['scheduledTime', 'revisedTime'].every((key) => value[key] === undefined || finite(value[key]))
    && ['place', 'gate', 'status'].every((key) => value[key] === undefined || typeof value[key] === 'string')
    && (value.tone === undefined || ['neutral', 'accent', 'warning'].includes(String(value.tone)))
}
/** Validate the network boundary before publishing data to a card. */
export function isAirportFeedResponse(value: unknown): value is AirportFeedResponse {
  if (!record(value) || value.version !== 1 || !['fresh', 'stale', 'unavailable', 'disabled'].includes(String(value.status))
    || !finite(value.retryAfterSeconds) || value.retryAfterSeconds < 0) return false
  if (value.status === 'disabled' || value.status === 'unavailable') return value.snapshot === undefined
  const s = value.snapshot
  try {
    if (!record(s) || !record(s.airport) || typeof s.airport.timeZone !== 'string') return false
    new Intl.DateTimeFormat('en', { timeZone: s.airport.timeZone }).format(0)
  } catch { return false }
  return record(s) && record(s.airport)
    && ['iata', 'name', 'city', 'timeZone'].every((key) => typeof (s.airport as Record<string, unknown>)[key] === 'string')
    && ['fetchedAt', 'freshUntil', 'expiresAt', 'windowStart', 'windowEnd'].every((key) => finite(s[key]))
    && Number(s.fetchedAt) <= Number(s.freshUntil) && Number(s.freshUntil) <= Number(s.expiresAt)
    && Number(s.windowStart) < Number(s.windowEnd)
    && Array.isArray(s.departures) && s.departures.every(movement)
    && Array.isArray(s.arrivals) && s.arrivals.every(movement)
}
