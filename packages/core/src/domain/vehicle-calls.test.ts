import { describe, expect, it } from 'vitest'
import { vehicleCalls } from './vehicle-calls.ts'
import type { NetworkSnapshot, NetworkTrain } from './network.ts'

const train: NetworkTrain = { id: 't', route: 'R', shortName: 'R1', headsign: 'End', category: 'regional', start: 0, end: 90,
  stops: [[0, 0, 5], [1, 20, 30], [0, 40, 45], [2, 90, 90]] }
const snapshot = { stops: [[0, 0, 'Loop'], [0, 0, 'Middle', '2'], [0, 0, 'End']], trains: [train] } as unknown as NetworkSnapshot
describe('vehicle calls', () => {
  it('tracks dwell, onward calls, repeated stations and backward seeking', () => {
    expect(vehicleCalls(snapshot, train, 10).map(call => call.id)).toEqual(['t:1', 't:2', 't:3'])
    expect(vehicleCalls(snapshot, train, 20)[0]).toMatchObject({ name: 'Middle', atStop: true, time: 30, platform: '2' })
    expect(vehicleCalls(snapshot, train, 31)[0]).toMatchObject({ name: 'Loop', atStop: false })
    expect(vehicleCalls(snapshot, train, 0)[0].id).toBe('t:0')
    expect(vehicleCalls(snapshot, train, 91)).toEqual([])
  })
  it('does not infer a terminus from a chunk boundary or an unknown headsign', () => {
    expect(vehicleCalls(snapshot, train, 10).at(-1)?.isDestination).toBe(true)
    expect(vehicleCalls(snapshot, { ...train, headsign: '' }, 10).some(call => call.isDestination)).toBe(false)
    expect(vehicleCalls(snapshot, { ...train, stops: train.stops.slice(0, 2) }, 10).at(-1)?.isDestination).toBe(false)
  })
  it('uses supplied adjusted times without adding delay and omits invalid calls and cancellations', () => {
    expect(vehicleCalls(snapshot, { ...train, realtime: { status: 'adjusted', delaySeconds: 60, skippedStops: 0, generatedAt: '' } }, 10)[0].time).toBe(20)
    expect(vehicleCalls(snapshot, { ...train, realtime: { status: 'cancelled', delaySeconds: 0, skippedStops: 0, generatedAt: '' } }, 10)).toEqual([])
    expect(vehicleCalls(snapshot, { ...train, stops: [[99, 20, 30], [1, NaN, 40], [1, 50, 40]] }, 10)).toEqual([])
    expect(vehicleCalls(snapshot, train, NaN)).toEqual([])
  })
})
