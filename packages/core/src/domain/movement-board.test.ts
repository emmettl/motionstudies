import { describe, expect, it } from 'vitest'
import { movementBoardWindow, movementsForBoard } from './movement-board.ts'

describe('movement boards follow the study clock', () => {
  const study = { time: 30720, windowStart: 30600, windowEnd: 36000 }
  it('clips the rolling horizon to the study bounds, including endpoints', () => {
    expect(movementBoardWindow(study)).toEqual({ start: 30600, end: 34320 })
    expect(movementBoardWindow({ ...study, time: 36000 })).toEqual({ start: 35400, end: 36000 })
    expect(movementBoardWindow(study, { lookBehindSeconds: 0, lookAheadSeconds: 7200 })).toEqual({ start: 30720, end: 36000 })
  })

  it('sorts by numeric time before limiting rows, without changing the input', () => {
    const rows = [{ id: 'c', time: 33000 }, { id: 'b', time: 31200 }, { id: 'a', time: 31200 }]
    const original = rows.slice()
    expect(movementsForBoard(rows, movementBoardWindow(study), 2).map((entry) => entry.id)).toEqual(['a', 'b'])
    expect(rows).toEqual(original)
  })

  it('excludes unknown, invalid and out-of-window times instead of guessing', () => {
    const rows = [{ id: 'missing' }, { id: 'bad', time: NaN }, { id: 'infinite', time: Infinity },
      { id: 'before', time: 30599 }, { id: 'start', time: 30600 }, { id: 'end', time: 34320 }, { id: 'after', time: 34321 }]
    expect(movementsForBoard(rows, movementBoardWindow(study)).map((entry) => entry.id)).toEqual(['start', 'end'])
  })

  it('drops past rows during playback and restores them when seeking backward', () => {
    const rows = [{ id: 'old', time: 31200 }, { id: 'next', time: 35100 }]
    expect(movementsForBoard(rows, movementBoardWindow(study)).map((entry) => entry.id)).toEqual(['old'])
    expect(movementsForBoard(rows, movementBoardWindow({ ...study, time: 33000 })).map((entry) => entry.id)).toEqual(['next'])
    expect(movementsForBoard(rows, movementBoardWindow(study)).map((entry) => entry.id)).toEqual(['old'])
  })

  it('honours a changed study window and horizon', () => {
    const rows = [{ id: 'near', time: 31200 }, { id: 'later', time: 33000 }]
    expect(movementsForBoard(rows, movementBoardWindow({ ...study, windowEnd: 32400 }))).toEqual([rows[0]])
    expect(movementsForBoard(rows, movementBoardWindow(study, { lookAheadSeconds: 60 }))).toEqual([])
  })

  it('preserves the time coordinate across midnight', () => {
    const window = movementBoardWindow({ time: 86100, windowStart: 84600, windowEnd: 90000 })
    expect(window).toEqual({ start: 85500, end: 89700 })
    expect(movementsForBoard([{ id: 'after', time: 87000 }, { id: 'before', time: 85800 }, { id: 'wrong-day', time: 600 }], window).map((entry) => entry.id)).toEqual(['before', 'after'])
  })

  it('does not show stale movements for an invalid or out-of-study clock', () => {
    for (const time of [NaN, Infinity, 30599, 36001]) {
      expect(movementBoardWindow({ ...study, time })).toBeUndefined()
    }
    expect(movementBoardWindow({ ...study, windowEnd: 0 })).toBeUndefined()
    expect(movementBoardWindow(study, { lookAheadSeconds: -1 })).toBeUndefined()
    expect(movementBoardWindow(study, { lookBehindSeconds: Infinity })).toBeUndefined()
    expect(movementsForBoard([{ id: 'a', time: 31200 }], undefined)).toEqual([])
  })
})
