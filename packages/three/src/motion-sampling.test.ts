import { expect, it } from 'vitest'
import { MAX_MARKER_STEP_SECONDS, MotionSampleWindow, markerStepSeconds } from './motion-sampling.ts'

it('sizes the sampling step by playback rate and caps the chord length', () => {
  expect(markerStepSeconds(true, 30, 0.1)).toBe(3)
  expect(markerStepSeconds(true, 120, 0.2)).toBe(MAX_MARKER_STEP_SECONDS)
  expect(markerStepSeconds(true, 1920, 0.1)).toBe(MAX_MARKER_STEP_SECONDS)
  expect(markerStepSeconds(false, 30, 0.1)).toBe(0)
  expect(markerStepSeconds(true, 0, 0.1)).toBe(0)
  expect(markerStepSeconds(true, 30, NaN)).toBe(0)
})

it('interpolates inside the window and asks for a pass when the clock leaves it', () => {
  const window = new MotionSampleWindow()
  expect(window.plan(100, true, 30, 3)).toBe('seek')
  window.record(100, 103, 90)
  expect(window.plan(100, true, 30, 3)).toBe('none')
  expect(window.mix(100)).toBe(0)
  expect(window.mix(101.5)).toBeCloseTo(0.5)
  expect(window.mix(110)).toBe(1)
  expect(window.plan(102.9, true, 30, 3)).toBe('none')
  expect(window.plan(103, true, 30, 3)).toBe('update')
  expect(window.continues(103.2)).toBe(true)
  expect(window.continues(140)).toBe(false)
})

it('treats jumps beyond a quarter second of playback as seeks', () => {
  const window = new MotionSampleWindow()
  window.record(100, 103, 90)
  expect(window.plan(109, true, 30, 3)).toBe('update')
  expect(window.plan(111, true, 30, 3)).toBe('seek')
  expect(window.plan(93, true, 30, 3)).toBe('update')
  expect(window.plan(92, true, 30, 3)).toBe('seek')
  window.record(200, 200, 195)
  expect(window.plan(200, false, 30, 0)).toBe('none')
  window.record(198, 204, 195)
  expect(window.plan(200, false, 30, 0)).toBe('update')
  window.record(200, 200, 195)
  expect(window.plan(201, false, 30, 0)).toBe('seek')
  expect(window.plan(199, false, 30, 0)).toBe('seek')
  expect(window.mix(200)).toBe(0)
})

it('starts a pass on the frame a trail grid time is crossed', () => {
  const window = new MotionSampleWindow()
  window.record(100, 120, 90)
  expect(window.plan(104.9, true, 100, 20)).toBe('none')
  expect(window.plan(105, true, 100, 20)).toBe('update')
})
