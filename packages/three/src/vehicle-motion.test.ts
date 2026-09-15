import { expect, it } from 'vitest'
import type { NetworkTrain } from '@motionstudies/core/domain/network'
import {
  MOTION_CULLED,
  MOTION_HIDDEN,
  MOTION_MOVING,
  MOTION_STALE,
  MOTION_TERMINAL,
  VehicleMotionTable,
} from './vehicle-motion.ts'

const train = (id: string): NetworkTrain =>
  ({ id, route: '1', category: 'regional', headsign: 'T', shortName: '1', start: 0, end: 600, stops: [[0, 0, 0], [1, 600, 600]] })

it('draws moving journeys along their chord and hides them once the clock is stale', () => {
  const table = new VehicleMotionTable([train('a'), train('b')])
  const out = [0, 0, 0]
  expect(table.displayed(1, 100, 30, out)).toBe(false)
  table.from.set([0, 0.2, 0], 3)
  table.to.set([10, 0.2, -10], 3)
  table.windows[2] = 100
  table.windows[3] = 110
  table.set(1, MOTION_MOVING, 100, 108)
  expect(table.placed(1)).toBe(true)
  expect(table.displayed(1, 105, 30, out)).toBe(true)
  expect(out).toEqual([5, expect.closeTo(0.2), -5])
  expect(table.displayed(1, 130, 30, out)).toBe(true)
  expect(out[0]).toBe(10)
  expect(table.displayed(1, 141, 30, out)).toBe(false)
  expect(table.displayed(1, 69, 30, out)).toBe(false)
  table.windows[3] = 100
  expect(table.displayed(1, 100, 0, out)).toBe(true)
  expect(out[0]).toBe(0)
  expect(table.displayed(1, 100.5, 0, out)).toBe(false)
})

it('keeps terminal positions for arrival labels without a moving marker', () => {
  const table = new VehicleMotionTable([train('a')])
  table.from.set([4, 0.2, 2])
  table.set(0, MOTION_TERMINAL, 600, Infinity)
  const out = [0, 0, 0]
  expect(table.displayed(0, 5000, 0, out)).toBe(true)
  expect(out).toEqual([4, expect.closeTo(0.2), 2])
  table.set(0, MOTION_HIDDEN, -Infinity, Infinity)
  expect(table.placed(0)).toBe(false)
})

it('schedules refreshes by validity interval, pause state and view generation', () => {
  const table = new VehicleMotionTable([train('a')])
  expect(table.due(0, 0, true, 1)).toBe(true)
  table.set(0, MOTION_MOVING, 100, 108)
  expect(table.due(0, 104, true, 1)).toBe(false)
  expect(table.due(0, 108, true, 1)).toBe(true)
  expect(table.due(0, 99, true, 1)).toBe(true)
  table.set(0, MOTION_MOVING, 100, 100)
  expect(table.due(0, 100, false, 1)).toBe(false)
  expect(table.due(0, 100.5, false, 1)).toBe(true)
  table.set(0, MOTION_HIDDEN, -Infinity, 599.999)
  expect(table.due(0, 599, false, 1)).toBe(false)
  expect(table.due(0, 600, false, 1)).toBe(true)
  table.set(0, MOTION_CULLED, 100, 100)
  table.viewStamps[0] = 3
  expect(table.due(0, 100, false, 3)).toBe(false)
  expect(table.due(0, 100, false, 4)).toBe(true)
  table.set(0, MOTION_HIDDEN, -Infinity, Infinity)
  expect(table.due(0, 1e9, true, 1)).toBe(false)
  table.invalidate()
  expect(table.state[0]).toBe(MOTION_STALE)
  expect(table.due(0, 1e9, true, 1)).toBe(true)
})
