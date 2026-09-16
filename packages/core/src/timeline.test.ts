import { describe, expect, it } from 'vitest'
import { createTimelineModel, formatTimelineTime, timelineBinAt, timelinePosition, timelineTime } from './timeline.ts'

describe('shared timeline geometry and evidence', () => {
  it('clips intervals to a non-zero window without shifting the time scale', () => {
    const model = createTimelineModel([{ start: 90, end: 110, value: 4 }, { start: 110, end: 130, value: 8 }], { start: 100, end: 120 })
    expect(model.bars.map(({ x, width, height }) => [x, width, height])).toEqual([[0, .5, .5], [.5, .5, 1]])
    expect(timelinePosition(110, model.window)).toBe(.5)
    expect(timelineTime(.76, model.window, 5)).toBe(115)
    expect(timelineTime(2, model.window)).toBe(120)
  })
  it('breaks lines at unknown intervals and gaps; keeps measured zero distinct', () => {
    const model = createTimelineModel([{ start: 0, end: 1, value: 0 }, { start: 1, end: 2, value: null }, { start: 2, end: 3, value: 4 }, { start: 4, end: 5, value: 2 }], { start: 0, end: 5 })
    expect(model.lines.map(line => line.length)).toEqual([1, 1, 1])
    expect(timelineBinAt(model, 0)?.value).toBe(0)
    expect(timelineBinAt(model, 1)?.value).toBeNull()
    expect(timelineBinAt(model, 3)).toBeUndefined()
    expect(timelineBinAt(model, 5)).toBeUndefined()
  })
  it('handles empty and zero series, fixed scales and overnight service times', () => {
    expect(createTimelineModel([], { start: 0, end: 1 }).maximum).toBe(0)
    expect(createTimelineModel([{ start: 0, end: 1, value: 0 }], { start: 0, end: 1 }).bars[0].height).toBe(0)
    expect(createTimelineModel([{ start: 0, end: 1, value: 4 }], { start: 0, end: 1 }, 8).bars[0].height).toBe(.5)
    expect(formatTimelineTime(86400)).toBe('24:00')
    expect(formatTimelineTime(90600)).toBe('25:10')
    expect(() => createTimelineModel([{ start: 0, end: 2, value: 1 }, { start: 1, end: 3, value: 2 }], { start: 0, end: 3 })).toThrow('non-overlapping')
    expect(() => createTimelineModel([], { start: 1, end: 1 })).toThrow('window')
  })
})
