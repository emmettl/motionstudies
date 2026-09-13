import { describe, expect, it } from 'vitest'
import { decodeNetworkPatterns, encodeNetworkPatterns, validateNetworkPatterns } from './network-patterns.ts'
import type { NetworkDayChunk, NetworkTrain } from './network.ts'

const train: NetworkTrain = { id: 'first', route: 'B', shortName: 'B', headsign: 'End', category: 'bus',
  start: 86000, end: 86600, stops: [[0, 86000, 86030], [1, 86100, 86110], [0, 86400, 86420], [2, 86600, 86600]], pathSegments: [0, 1, 2] }
const shifted = { ...train, id: 'second', start: train.start + 300, end: train.end + 300,
  stops: train.stops.map(([stop, arrival, departure]) => [stop, arrival + 300, departure + 300] as const) }
const chunk: NetworkDayChunk = { windowStart: 85200, windowEnd: 90000, trains: [train, shifted] }

describe('network pattern codec', () => {
  it('shares relative schedules while preserving identity, repeat visits, paths and after-midnight calls', () => {
    const encoded = encodeNetworkPatterns(chunk)
    expect(encoded.patterns).toHaveLength(1)
    expect(decodeNetworkPatterns(JSON.parse(JSON.stringify(encoded)))).toEqual(chunk)
    expect(chunk.trains[0].stops[0][1]).toBe(86000)
  })
  it('supports explicit legacy format adapters and multiple categories without assuming buses', () => {
    const mixed = { ...chunk, trains: [train, { ...shifted, category: 'regional' as const }] }
    const encoded = encodeNetworkPatterns(mixed, { format: 'legacy-v1' })
    expect(encoded.patterns).toHaveLength(2)
    expect(decodeNetworkPatterns(encoded, { format: 'legacy-v1' })).toEqual(mixed)
    expect(() => decodeNetworkPatterns(encoded)).toThrow()
    expect(() => decodeNetworkPatterns(encoded, { format: 'legacy-v1', categories: ['bus'] })).toThrow()
  })
  it('rejects ambiguous IDs, nonexistent patterns, reversed calls and disconnected pattern metadata', () => {
    const encoded = encodeNetworkPatterns(chunk)
    expect(() => validateNetworkPatterns({ ...encoded, journeys: [...encoded.journeys, encoded.journeys[0]] })).toThrow()
    expect(() => validateNetworkPatterns({ ...encoded, journeys: [['x', 0, 30]] })).toThrow()
    expect(() => validateNetworkPatterns({ ...encoded, patterns: [{ ...encoded.patterns[0], stops: [[0, 20, 10], [1, 30, 30]] }] })).toThrow()
    expect(() => validateNetworkPatterns({ ...encoded, patterns: [{ ...encoded.patterns[0], pathSegments: [0] }] })).toThrow()
    expect(() => validateNetworkPatterns(null)).toThrow()
  })
})
