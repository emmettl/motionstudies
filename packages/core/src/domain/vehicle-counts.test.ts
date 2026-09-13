import { expect, it } from 'vitest'
import { countableVehicleTrains, createActiveTimetableVehicleCounter } from './vehicle-counts.ts'
import { buildStationIndex, type NetworkSnapshot, type NetworkTrain } from './network.ts'

const train: NetworkTrain = { id: 'one', route: 'A', shortName: 'A', category: 'regional', headsign: 'End', start: 10, end: 20, stops: [[0, 10, 10], [1, 20, 20]] }

it('counts inclusive intervals across backward seeks, cancellation and zero-length trips', () => {
  const trains = [train, { ...train, id: 'two', start: 20, end: 30 },
    { ...train, id: 'zero', start: 20, end: 20 },
    { ...train, id: 'bad', start: 30, end: 10 },
    { ...train, id: 'cancelled', realtime: { status: 'cancelled' as const, delaySeconds: 0, skippedStops: 0, generatedAt: '' } }]
  const count = createActiveTimetableVehicleCounter(trains)
  for (const time of [30, 20, 10, 9, 20.001, 19.999, 31, NaN, Infinity, -Infinity]) {
    expect(count(time)).toBe(trains.filter(t => t.realtime?.status !== 'cancelled' && t.start <= time && time <= t.end).length)
  }
})

it('keeps timetable counting distinct from positionable journeys', () => {
  const incomplete = { ...train, stops: [train.stops[0]] }
  expect(createActiveTimetableVehicleCounter([incomplete])(15)).toBe(1)
  expect(createActiveTimetableVehicleCounter([incomplete], { requirePositionable: true })(15)).toBe(0)
})

it('resolves selection against the current snapshot and intersects category and route', () => {
  const snapshot = { stops: [[0, 0, 'Start'], [1, 1, 'End']], trains: [train, { ...train, id: 'other', route: 'B', stops: [[1, 10, 10], [1, 20, 20]] }] } as unknown as NetworkSnapshot
  const stations = buildStationIndex(snapshot)
  expect(countableVehicleTrains(snapshot, stations, { station: { name: 'Start' } })).toEqual([train])
  expect(countableVehicleTrains(snapshot, stations, { station: { name: 'Missing' } })).toEqual([])
  expect(countableVehicleTrains(snapshot, stations, { route: { name: 'A', category: 'regional' }, category: 'bus' })).toEqual([])
  expect(countableVehicleTrains(snapshot, stations, {})).toEqual(snapshot.trains)
  const replacement = { ...snapshot, trains: [snapshot.trains[1]] }
  expect(countableVehicleTrains(replacement, buildStationIndex(replacement), { station: { name: 'Start' } })).toEqual([])
})
