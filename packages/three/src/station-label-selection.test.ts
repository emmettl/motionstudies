import { describe, expect, it } from 'vitest'
import type { NetworkSnapshot, NetworkTrain, NetworkRouteIndexEntry, ServiceCategory } from '@motionstudies/core/domain/network'
import { compareStationLabelCandidates, stationLabelSelection, stationLabelPriority } from './station-labels.ts'

const train = (id: string, stops: number[], category: ServiceCategory = 'metro', route = 'Branch line'): NetworkTrain => ({
  id, route, category, headsign: '', shortName: id, start: 0, end: 100,
  stops: stops.map(index => [index, 0, 0]),
})
const snapshot: Pick<NetworkSnapshot, 'stops' | 'trains'> = {
  stops: ['West', 'Junction', 'East', 'North', 'Other'].map(name => [0, 0, name, name]),
  trains: [
    train('outbound', [0, 1, 2]), train('inbound', [2, 1, 0]), train('branch', [0, 1, 3]),
    train('other-category', [1, 4], 'regional'), train('other-route', [1, 4], 'metro', 'Other line'),
  ],
}
const route: NetworkRouteIndexEntry = {
  id: 'branch', name: 'Branch line', category: 'metro', trainIds: ['outbound'], stopIndexes: [0, 1, 2], headsigns: [],
}

describe('shared station label selection', () => {
  it('includes both ends of every branch, deduplicates directions and matches category', () => {
    const selection = stationLabelSelection(snapshot, route)
    expect([...selection.stationNames]).toEqual(['West', 'Junction', 'East', 'North'])
    expect([...selection.terminalNames]).toEqual(['West', 'East', 'North'])
  })
  it('resolves reference indexes independently and retains branch endpoints across empty chunks', () => {
    const reference = {
      stops: [...snapshot.stops].reverse(),
      trains: snapshot.trains.map(train => ({ ...train, stops: train.stops.map(([index, arrival, departure]) => [4 - index, arrival, departure] as const) })),
    }
    const emptyChunk = { ...snapshot, trains: [] }
    expect(stationLabelSelection(emptyChunk, route, undefined, reference))
      .toEqual(stationLabelSelection(snapshot, route))
    expect([...stationLabelSelection(emptyChunk, route).stationNames]).toEqual(['West', 'Junction', 'East'])
    expect(stationLabelSelection(emptyChunk, route).terminalNames.size).toBe(0)
  })
  it('uses only the selected service endpoints, including short turns', () => {
    const selection = stationLabelSelection(snapshot, route, train('short-turn', [1, 3]))
    expect([...selection.stationNames]).toEqual(['Junction', 'North'])
    expect([...selection.terminalNames]).toEqual(['Junction', 'North'])
  })
  it('prioritises selected stations and terminals over retained, highly ranked intermediate stops', () => {
    const { terminalNames } = stationLabelSelection(snapshot, route)
    const candidates = [
      { name: 'Junction', rank: 0, retained: true, distance: 1 },
      { name: 'West', rank: 90, retained: false, distance: 90 },
      { name: 'North', rank: 100, retained: false, distance: 100 },
    ].map(candidate => ({ ...candidate, priority: stationLabelPriority(candidate.name, 'North', terminalNames, true) }))
    expect(candidates.sort(compareStationLabelCandidates).map(candidate => candidate.name)).toEqual(['North', 'West', 'Junction'])
    expect(stationLabelPriority('Junction', 'Junction', terminalNames, true))
      .toBeLessThan(stationLabelPriority('West', 'Junction', terminalNames, true))
  })
  it('clears priorities on deselection and tolerates empty, single-stop and circular services', () => {
    const cleared = stationLabelSelection(snapshot)
    expect(cleared.stationNames.size).toBe(0)
    expect(cleared.terminalNames.size).toBe(0)
    expect(stationLabelPriority('West', undefined, cleared.terminalNames, false)).toBe(3)
    expect(stationLabelSelection(snapshot, undefined, train('empty', [])).terminalNames.size).toBe(0)
    expect([...stationLabelSelection(snapshot, undefined, train('single', [0])).terminalNames]).toEqual(['West'])
    expect([...stationLabelSelection(snapshot, undefined, train('loop', [0, 1, 2, 0])).terminalNames]).toEqual(['West'])
  })
})
