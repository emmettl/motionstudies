import type { NetworkSnapshot, NetworkTrain } from './network.ts'

export type StationCallDirection = 'arrival' | 'departure'
export interface StationCall {
  readonly id: string
  readonly train: NetworkTrain
  /** Call occurrence within this train, not a global station index. */
  readonly index: number
  readonly arrival: number
  readonly departure: number
  readonly origin: string
  readonly destination: string
  readonly allowsArrival: boolean
  readonly allowsDeparture: boolean
  readonly movementAvailable?: boolean
  readonly source?: string
  readonly windowStart?: number
  readonly windowEnd?: number
}
export interface StationCallSelection {
  readonly name: string
  /** When supplied, source IDs are authoritative; never fall back to a name match. */
  readonly stopIds?: readonly string[]
}
export interface StationCallPolicy {
  readonly includeTrain?: (train: NetworkTrain) => boolean
  readonly allows?: (train: NetworkTrain, callIndex: number, direction: StationCallDirection) => boolean
  readonly origin?: (train: NetworkTrain, snapshot: NetworkSnapshot) => string | undefined
  readonly destination?: (train: NetworkTrain, snapshot: NetworkSnapshot) => string | undefined
}

/** Retain repeated visits and source-local indexes; passenger restrictions belong to the adapter. */
export function stationCalls(snapshot: NetworkSnapshot, selection: StationCallSelection, policy: StationCallPolicy = {}): readonly StationCall[] {
  const stops = new Set(snapshot.stops.flatMap((stop, index) =>
    (selection.stopIds ? Boolean(stop[4] && selection.stopIds.includes(stop[4])) : stop[2] === selection.name) ? [index] : []))
  const calls: StationCall[] = [], ids = new Map<string, NetworkTrain>()
  for (const train of snapshot.trains) {
    if (policy.includeTrain && !policy.includeTrain(train)) continue
    const prior = ids.get(train.id)
    if (prior) {
      if (prior === train || JSON.stringify(prior) === JSON.stringify(train)) continue
      throw new Error('Ambiguous duplicate journey identity in station source')
    }
    ids.set(train.id, train)
    train.stops.forEach(([stop, arrival, departure], index) => {
      if (!stops.has(stop) || !Number.isFinite(arrival) || !Number.isFinite(departure) || departure < arrival) return
      const allowsArrival = index > 0 && (policy.allows?.(train, index, 'arrival') ?? true)
      const allowsDeparture = index < train.stops.length - 1 && (policy.allows?.(train, index, 'departure') ?? true)
      if (!allowsArrival && !allowsDeparture) return
      calls.push({ id: `${train.id}:call:${index}`, train, index, arrival, departure,
        origin: policy.origin?.(train, snapshot) ?? snapshot.stops[train.stops[0][0]]?.[2] ?? '',
        destination: policy.destination?.(train, snapshot) ?? (train.headsign || snapshot.stops[train.stops.at(-1)![0]]?.[2] || ''),
        allowsArrival, allowsDeparture,
      })
    })
  }
  return calls
}

export interface StationCallSource {
  readonly id: string
  readonly selection: StationCallSelection
  readonly snapshot?: NetworkSnapshot
  readonly movements?: NetworkSnapshot
  readonly windowStart: number
  readonly windowEnd: number
  readonly policy?: StationCallPolicy
  readonly loading?: boolean
  readonly error?: boolean
}
export type StationSourceStatus = 'loading' | 'error' | 'unavailable' | 'date-mismatch' | 'partial' | 'ready'

export function stationSourceStatus(source: StationCallSource, serviceDate: string, requestedStart: number, requestedEnd: number): StationSourceStatus {
  if (source.error) return 'error'
  if (source.loading) return 'loading'
  if (!source.snapshot || ![source.windowStart, source.windowEnd, requestedStart, requestedEnd].every(Number.isFinite) ||
    source.windowEnd <= source.windowStart || requestedEnd < requestedStart) return 'unavailable'
  if (source.snapshot.metadata.serviceDate !== serviceDate) return 'date-mismatch'
  return source.windowStart > requestedStart || source.windowEnd < requestedEnd ? 'partial' : 'ready'
}

/** Sources remain independently dated and retryable. Equal names/times never merge services. */
export function combinedStationCalls(serviceDate: string, sources: readonly StationCallSource[]): readonly StationCall[] {
  const result: StationCall[] = [], ids = new Set<string>()
  for (const source of sources) {
    if (!source.id || ids.has(source.id)) throw new Error('Station sources require distinct identities')
    ids.add(source.id)
    if (!source.snapshot || source.error || source.loading || source.snapshot.metadata.serviceDate !== serviceDate ||
      !Number.isFinite(source.windowStart) || !Number.isFinite(source.windowEnd) || source.windowEnd <= source.windowStart) continue
    const movementIds = source.movements?.metadata.serviceDate === serviceDate
      ? new Set(source.movements.trains.map(train => train.id)) : undefined
    for (const call of stationCalls(source.snapshot!, source.selection, source.policy)) {
      result.push({ ...call, id: `${encodeURIComponent(source.id)}:${call.id}`, source: source.id,
        movementAvailable: source.movements ? (movementIds?.has(call.train.id) ?? false) : undefined,
        windowStart: source.windowStart, windowEnd: source.windowEnd,
      })
    }
  }
  return result
}

/** Clip to both requested and source windows. Never wrap to an unacquired day. */
export function upcomingStationCalls(calls: readonly StationCall[], direction: StationCallDirection, time: number, windowStart: number, windowEnd: number, route = '', maxRows = 4): readonly StationCall[] {
  if (![time, windowStart, windowEnd].every(Number.isFinite) || time < windowStart || time >= windowEnd || !Number.isSafeInteger(maxRows) || maxRows < 1) return []
  const end = Math.min(windowEnd, time + 3600)
  return calls.filter(call => (direction === 'arrival' ? call.allowsArrival : call.allowsDeparture)
    && call[direction] >= Math.max(windowStart, call.windowStart ?? windowStart)
    && call[direction] < Math.min(windowEnd, call.windowEnd ?? windowEnd)
    && (!route || call.train.route === route) && call[direction] >= time && call[direction] < end)
    .sort((a, b) => a[direction] - b[direction] || a.id.localeCompare(b.id)).slice(0, maxRows)
}
