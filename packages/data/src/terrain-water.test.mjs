import { describe, expect, it } from 'vitest'
import { clipRingToBounds, pointInRing } from './terrain-water.mjs'
const ring = [[-2, -2], [2, -2], [2, 2], [-2, 2]]
describe('terrain water polygon preparation', () => {
  it('clips projected rings to a terrain rectangle without changing the source', () => {
    const clipped = clipRingToBounds(ring, { minEasting: -1, maxEasting: 1, minNorthing: -1, maxNorthing: 1 })
    expect(new Set(clipped.map(p => p.join(',')))).toEqual(new Set(['-1,-1', '1,-1', '1,1', '-1,1']))
    expect(ring[0]).toEqual([-2, -2])
    expect(clipRingToBounds(ring, { minEasting: 3, maxEasting: 4, minNorthing: 3, maxNorthing: 4 })).toEqual([])
  })
  it('supports independent outer and hole tests and either winding', () => {
    expect(pointInRing([0, 0], ring)).toBe(true)
    expect(pointInRing([3, 0], ring)).toBe(false)
    expect(pointInRing([0, 0], [...ring].reverse())).toBe(true)
    expect(pointInRing([0, 0], [])).toBe(false)
  })
})
