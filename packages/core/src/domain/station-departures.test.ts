import { describe, expect, it } from 'vitest'
import { stationDepartures } from './station-departures.ts'
import type { NetworkSnapshot } from './network.ts'

const snapshot = { stops: [[0, 0, 'Central', '2'], [0, 0, 'Via'], [0, 0, 'End']], trains: [
  { id: 'loop', route: 'R1', shortName: '', headsign: 'End', category: 'regional', start: 0, end: 100,
    stops: [[0, 0, 10], [1, 20, 21], [0, 30, 31], [2, 40, 40]] },
  { id: 'terminal', route: 'R2', shortName: '', headsign: 'Central', category: 'regional', start: 0, end: 100, stops: [[2, 0, 1], [0, 20, 20]] },
] } as unknown as NetworkSnapshot

describe('stationDepartures', () => {
  it('uses departure rather than arrival, retains repeat calls and omits terminal calls', () => {
    const result = stationDepartures(snapshot, 'Central')
    expect(result.map(({ id, time }) => ({ id, time }))).toEqual([{ id: 'loop:0', time: 10 }, { id: 'loop:2', time: 31 }])
    expect(result[0]).toMatchObject({ trainId: 'loop', service: 'R1', platform: '2', via: ['Via'], destination: 'End', status: 'scheduled' })
  })
  it('resolves indexes against each snapshot and leaves missing platforms unknown', () => {
    const reordered = { ...snapshot, stops: [snapshot.stops[2], snapshot.stops[1], [0, 0, 'Central']],
      trains: [{ ...snapshot.trains[0], stops: [[2, 0, 10], [0, 20, 20]] }] } as NetworkSnapshot
    expect(stationDepartures(reordered, 'Central')[0]).toMatchObject({ platform: undefined, destination: 'End' })
    expect(stationDepartures(reordered, 'Missing')).toEqual([])
  })
  it('preserves adjusted and cancelled provenance and rejects invalid times', () => {
    const adjusted = { ...snapshot, trains: [{ ...snapshot.trains[0], realtime: { status: 'adjusted', delaySeconds: 60, skippedStops: 0, generatedAt: 'fixture' } }] } as NetworkSnapshot
    expect(stationDepartures(adjusted, 'Central')[0]).toMatchObject({ time: 10, status: 'adjusted' })
    const cancelled = { ...adjusted, trains: [{ ...adjusted.trains[0], realtime: { ...adjusted.trains[0].realtime!, status: 'cancelled' }, stops: [[0, 0, NaN], [0, 1, 2], [2, 3, 3]] }] } as NetworkSnapshot
    expect(stationDepartures(cancelled, 'Central').map((entry) => entry.status)).toEqual(['cancelled'])
  })
})
