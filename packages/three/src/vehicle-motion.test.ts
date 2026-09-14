import { expect, it } from 'vitest'
import type { NetworkTrain } from '@motionstudies/core/domain/network'
import { VehicleMotionTable } from './vehicle-motion.ts'

const train = (id: string): NetworkTrain =>
  ({ id, route: '1', category: 'regional', headsign: 'T', shortName: '1', start: 0, end: 60, stops: [[0, 0, 0], [1, 60, 60]] })

it('indexes journeys, stamps placements per pass and forgets them on invalidation', () => {
  const trains = [train('a'), train('b')]
  const table = new VehicleMotionTable(trains)
  expect(table.index.get(trains[1])).toBe(1)
  expect(table.placed(1)).toBe(false)
  table.generation += 1
  table.stamps[1] = table.generation
  expect(table.placed(1)).toBe(true)
  expect(table.placed(0)).toBe(false)
  table.generation += 1
  expect(table.placed(1)).toBe(false)
  expect(table.placedBefore(1)).toBe(true)
  expect(table.placedBefore(0)).toBe(false)
  table.targets[3] = 4
  table.targetTime = 30
  table.invalidate()
  expect(table.placedBefore(1)).toBe(false)
  expect(Number.isNaN(table.targets[3])).toBe(true)
  expect(Number.isNaN(table.targetTime)).toBe(true)
})
