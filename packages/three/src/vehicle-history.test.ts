import { expect, it } from 'vitest'
import {
  VEHICLE_TRAIL_HISTORY_LENGTH,
  VEHICLE_TRAIL_HISTORY_STEP_SECONDS,
  VehicleHistory,
  trailGridMix,
  trailGridStart,
} from './vehicle-history.ts'

const sampler = (calls: number[]) => (time: number) => {
  calls.push(time)
  return time < 100 ? undefined : [time, 0.5, -time]
}

it('covers the trail window with brackets on a fixed study-time grid', () => {
  expect(VEHICLE_TRAIL_HISTORY_STEP_SECONDS).toBe(15)
  expect(VEHICLE_TRAIL_HISTORY_LENGTH).toBe(10)
  expect(trailGridStart(1000)).toBe(990)
  expect(trailGridStart(990)).toBe(990)
  expect(trailGridMix(1000, 990)).toBeCloseTo(10 / 15)
  expect(trailGridMix(1010, 990)).toBe(1)
  expect(trailGridMix(1000, NaN)).toBe(0)
})

it('samples the full window once, then only the grid time crossed', () => {
  const history = new VehicleHistory(2)
  const calls: number[] = []
  expect(history.fill(1, 990, sampler(calls))).toBe(10)
  expect(calls).toEqual([855, 870, 885, 900, 915, 930, 945, 960, 975, 990])
  expect(history.fill(1, 990, sampler(calls))).toBe(0)
  calls.length = 0
  expect(history.fill(1, 1005, sampler(calls))).toBe(1)
  expect(calls).toEqual([1005])
  const out = new Float32Array(3)
  expect(history.read(1, 1005, out, 0)).toBe(true)
  expect(Array.from(out)).toEqual([1005, 0.5, -1005])
  expect(history.read(1, 870, out, 0)).toBe(true)
  expect(history.read(1, 855, out, 0)).toBe(false)
  expect(history.read(0, 990, out, 0)).toBe(false)
})

it('records absent positions and refills after backwards or distant seeks', () => {
  const history = new VehicleHistory(1)
  const calls: number[] = []
  history.fill(0, 180, sampler(calls))
  const out = new Float32Array(6)
  expect(history.read(0, 90, out, 3)).toBe(false)
  expect(history.read(0, 105, out, 3)).toBe(true)
  expect(Array.from(out)).toEqual([0, 0, 0, 105, 0.5, -105])
  calls.length = 0
  expect(history.fill(0, 150, sampler(calls))).toBe(10)
  expect(calls[0]).toBe(15)
  calls.length = 0
  expect(history.fill(0, 600, sampler(calls))).toBe(10)
  expect(calls).toEqual([465, 480, 495, 510, 525, 540, 555, 570, 585, 600])
  history.invalidate()
  calls.length = 0
  expect(history.fill(0, 600, sampler(calls))).toBe(10)
})

it('caps samples per fill, leaving older grid times unknown until they are refilled', () => {
  const history = new VehicleHistory(1)
  const calls: number[] = []
  expect(history.fill(0, 990, sampler(calls), 4)).toBe(4)
  expect(calls).toEqual([945, 960, 975, 990])
  const out = new Float32Array(3)
  expect(history.read(0, 945, out, 0)).toBe(true)
  expect(history.read(0, 930, out, 0)).toBe(false)
  expect(history.read(0, 855, out, 0)).toBe(false)
  calls.length = 0
  expect(history.fill(0, 1005, sampler(calls), 4)).toBe(1)
  expect(calls).toEqual([1005])
  calls.length = 0
  history.fill(0, 1200, sampler(calls), 0)
  expect(calls).toEqual([1200])
  expect(history.read(0, 1185, out, 0)).toBe(false)
  calls.length = 0
  expect(history.fill(0, 1215, sampler(calls))).toBe(1)
})
