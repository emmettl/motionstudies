import type { NetworkDayChunk, NetworkTrain, ServiceCategory, TrainStop } from './network.ts'

export const NETWORK_PATTERN_FORMAT = 'network-patterns-v1'
export type NetworkPattern = Omit<NetworkTrain, 'id' | 'start'>
export interface PatternNetworkChunk {
  readonly format: string
  readonly windowStart: number
  readonly windowEnd: number
  readonly patterns: readonly NetworkPattern[]
  readonly journeys: readonly (readonly [id: string, start: number, pattern: number])[]
}
export interface PatternChunkOptions {
  /** A consumer may retain a previously published wire-format tag. */
  readonly format?: string
  readonly categories?: readonly ServiceCategory[]
}

/** Deduplicate relative schedules on disk; identities and absolute calls survive decoding. */
export function encodeNetworkPatterns(chunk: NetworkDayChunk, options: PatternChunkOptions = {}): PatternNetworkChunk {
  const patterns: NetworkPattern[] = [], indexes = new Map<string, number>()
  const journeys = chunk.trains.map(({ id, start, ...train }) => {
    const pattern: NetworkPattern = { ...train, end: train.end - start,
      stops: train.stops.map(([stop, arrival, departure]) => [stop, arrival - start, departure - start]),
    }
    const key = JSON.stringify(pattern)
    let index = indexes.get(key)
    if (index === undefined) { index = patterns.length; indexes.set(key, index); patterns.push(pattern) }
    return [id, start, index] as const
  })
  const result = { format: options.format ?? NETWORK_PATTERN_FORMAT, windowStart: chunk.windowStart,
    windowEnd: chunk.windowEnd, patterns, journeys }
  validateNetworkPatterns(result, options)
  return result
}

export function validateNetworkPatterns(value: unknown, options: PatternChunkOptions = {}): asserts value is PatternNetworkChunk {
  const chunk = value as PatternNetworkChunk | null
  if (!chunk || chunk.format !== (options.format ?? NETWORK_PATTERN_FORMAT) ||
    !Number.isFinite(chunk.windowStart) || !Number.isFinite(chunk.windowEnd) || chunk.windowEnd <= chunk.windowStart ||
    !Array.isArray(chunk.patterns) || !Array.isArray(chunk.journeys)) throw new Error('Invalid network pattern chunk')
  for (const pattern of chunk.patterns) {
    if (!pattern || !Number.isFinite(pattern.end) || pattern.end < 0 ||
      typeof pattern.route !== 'string' || typeof pattern.headsign !== 'string' || typeof pattern.shortName !== 'string' ||
      typeof pattern.category !== 'string' || (options.categories && !options.categories.includes(pattern.category)) ||
      !Array.isArray(pattern.stops) || pattern.stops.length < 2) throw new Error('Invalid network pattern')
    let previous = -Infinity
    for (const stop of pattern.stops) {
      if (!Array.isArray(stop) || stop.length !== 3) throw new Error('Invalid pattern stop')
      const [index, arrival, departure] = stop as unknown as TrainStop
      if (!Number.isSafeInteger(index) || index < 0 || !Number.isFinite(arrival) || !Number.isFinite(departure) ||
        departure < arrival || arrival < previous) throw new Error('Invalid pattern stop timing')
      previous = departure
    }
    if (pattern.end < previous) throw new Error('Pattern ends before its final call')
    if (pattern.pathSegments && (!Array.isArray(pattern.pathSegments) || pattern.pathSegments.length !== pattern.stops.length - 1 ||
      pattern.pathSegments.some((index: number | null) => index !== null && (!Number.isSafeInteger(index) || index < 0)))) throw new Error('Invalid pattern paths')
  }
  const ids = new Set<string>()
  for (const journey of chunk.journeys) {
    if (!Array.isArray(journey) || journey.length !== 3) throw new Error('Invalid pattern journey')
    const [id, start, index] = journey
    if (typeof id !== 'string' || !id || ids.has(id) || !Number.isFinite(start) || !Number.isSafeInteger(index) || index < 0 ||
      !chunk.patterns[index] || !Number.isFinite(start + chunk.patterns[index].end) ||
      chunk.patterns[index].stops.some((stop: TrainStop) => !Number.isFinite(start + stop[1]) || !Number.isFinite(start + stop[2]))) throw new Error('Invalid pattern journey identity or time')
    ids.add(id)
  }
}

export function decodeNetworkPatterns(value: unknown, options: PatternChunkOptions = {}): NetworkDayChunk {
  validateNetworkPatterns(value, options)
  return { windowStart: value.windowStart, windowEnd: value.windowEnd,
    trains: value.journeys.map(([id, start, index]) => {
      const pattern = value.patterns[index]
      return { ...pattern, id, start, end: start + pattern.end,
        stops: pattern.stops.map(([stop, arrival, departure]) => [stop, start + arrival, start + departure]),
      }
    }),
  }
}
