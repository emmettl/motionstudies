import { describe, expect, it } from 'vitest'
import { combinedStationCalls, stationCalls, stationSourceStatus, upcomingStationCalls, type StationCallSource } from './station-calls.ts'
import type { NetworkSnapshot } from './network.ts'

const snapshot = { metadata: { serviceDate: '2026-09-04' }, stops: [[0, 0, 'Central', '1', 'a'], [0, 0, 'Central', '2', 'b'], [0, 0, 'End', '', 'c']],
  trains: [{ id: 'loop', route: 'R', shortName: 'R', headsign: 'End', category: 'regional', start: 0, end: 100,
    stops: [[0, 0, 5], [1, 15, 20], [0, 30, 35], [2, 80, 80]] }],
} as unknown as NetworkSnapshot
const source: StationCallSource = { id: 'one', selection: { name: 'Central', stopIds: ['a'] }, snapshot, windowStart: 0, windowEnd: 100 }

describe('multi-source station calls', () => {
  it('resolves source IDs rather than coincident names and retains each visit', () => {
    const calls = stationCalls(snapshot, source.selection)
    expect(calls.map(call => call.index)).toEqual([0, 2])
    expect(calls[0]).toMatchObject({ allowsArrival: false, allowsDeparture: true })
    expect(stationCalls(snapshot, { name: 'Central', stopIds: ['missing'] })).toEqual([])
    expect(stationCalls({ ...snapshot, trains: [snapshot.trains[0], snapshot.trains[0]] }, source.selection)).toHaveLength(2)
    expect(() => stationCalls({ ...snapshot, trains: [snapshot.trains[0], { ...snapshot.trains[0], headsign: 'Conflict' }] }, source.selection)).toThrow('Ambiguous')
    expect(stationCalls(snapshot, source.selection, { allows: (_train, index, direction) => index !== 2 || direction === 'arrival' })[1]).toMatchObject({ allowsArrival: true, allowsDeparture: false })
  })
  it('keeps matching IDs/times in different sources, suppresses wrong days and stale movement matches', () => {
    const other = { ...source, id: 'two', movements: { ...snapshot, metadata: { ...snapshot.metadata, serviceDate: '2026-09-05' } } }
    const calls = combinedStationCalls('2026-09-04', [source, other])
    expect(calls.map(call => call.id)).toEqual(['one:loop:call:0', 'one:loop:call:2', 'two:loop:call:0', 'two:loop:call:2'])
    expect(calls[2].movementAvailable).toBe(false)
    expect(combinedStationCalls('2026-09-05', [source])).toEqual([])
    expect(() => combinedStationCalls('2026-09-04', [source, source])).toThrow()
  })
  it('clips source and requested windows without inventing next-day calls, preserving independent failures', () => {
    const partial = { ...source, windowStart: 20, windowEnd: 40 }
    const calls = combinedStationCalls('2026-09-04', [partial, { ...source, id: 'failed', error: true }])
    expect(upcomingStationCalls(calls, 'departure', 0, 0, 100).map(call => call.departure)).toEqual([35])
    expect(upcomingStationCalls(calls, 'departure', 40, 0, 100)).toEqual([])
    expect(upcomingStationCalls(calls, 'departure', 0, 0, 35)).toEqual([])
    expect(stationSourceStatus(partial, '2026-09-04', 0, 100)).toBe('partial')
    expect(stationSourceStatus({ ...source, loading: true }, '2026-09-04', 0, 100)).toBe('loading')
    expect(stationSourceStatus(source, '2026-09-05', 0, 100)).toBe('date-mismatch')
  })
})
