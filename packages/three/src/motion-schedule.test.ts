import { describe, expect, it } from 'vitest'
import {
  MAX_CHORD_SECONDS,
  MotionCycle,
  MotionFrameBudget,
  motionLookahead,
  motionStaleSeconds,
} from './motion-schedule.ts'

describe('motion frame budget', () => {
  it('grows on smooth frames and shrinks under sustained load, within its bounds', () => {
    const budget = new MotionFrameBudget(3, 24, 6)
    for (let i = 0; i < 200; i++) budget.update(1 / 60)
    expect(budget.milliseconds).toBe(24)
    expect(budget.reduced).toBe(false)
    for (let i = 0; i < 200; i++) budget.update(1 / 20)
    expect(budget.milliseconds).toBe(3)
    expect(budget.reduced).toBe(true)
  })

  it('keeps growing while motion is behind and frames stay above about 24 FPS', () => {
    const budget = new MotionFrameBudget(3, 24, 6)
    for (let i = 0; i < 100; i++) budget.update(1 / 30, true)
    expect(budget.milliseconds).toBe(24)
    for (let i = 0; i < 100; i++) budget.update(1 / 15, true)
    expect(budget.milliseconds).toBe(24)
    for (let i = 0; i < 200; i++) budget.update(1 / 15, false)
    expect(budget.milliseconds).toBe(3)
  })

  it('ignores invalid deltas and a single long gap', () => {
    const budget = new MotionFrameBudget(3, 24, 6)
    for (const delta of [NaN, Infinity, -1, 0, 5]) expect(budget.update(delta)).toBe(6)
    expect(budget.reduced).toBe(false)
  })
})

describe('motion windows', () => {
  it('sizes chords by the scheduler cycle, never below a tenth of a second or above the chord cap', () => {
    expect(motionLookahead(true, 30, 0)).toBeCloseTo(3)
    expect(motionLookahead(true, 30, 0.2)).toBeCloseTo(9)
    expect(motionLookahead(true, 30, 5)).toBe(MAX_CHORD_SECONDS)
    expect(motionLookahead(true, 1920, 0)).toBe(MAX_CHORD_SECONDS)
    expect(motionLookahead(false, 30, 1)).toBe(0)
    expect(motionLookahead(true, 0, 1)).toBe(0)
    expect(motionLookahead(true, 30, NaN)).toBeCloseTo(3)
  })

  it('hides stale vertices only after the chord cap or three quarters of a real second', () => {
    expect(motionStaleSeconds(true, 30)).toBe(MAX_CHORD_SECONDS)
    expect(motionStaleSeconds(true, 1920)).toBe(1440)
    expect(motionStaleSeconds(false, 1920)).toBe(0)
  })

  it('estimates the revisit cycle from throughput when the budget runs out', () => {
    const cycle = new MotionCycle()
    expect(cycle.record(40, 1 / 60, false, 7000)).toBeCloseTo(1 / 60)
    for (let i = 0; i < 60; i++) cycle.record(400, 1 / 40, true, 7000)
    expect(cycle.seconds).toBeCloseTo(7000 / 16000, 2)
    expect(cycle.record(0, 1 / 40, true, 7000)).toBeGreaterThan(0.43)
    expect(cycle.record(10, NaN, true, 7000)).toBe(cycle.seconds)
  })
})
