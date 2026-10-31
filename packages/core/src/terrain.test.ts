import { describe, expect, it } from 'vitest'
import { terrainPathDistances, terrainPathPoint, terrainMaskAt, terrainSegmentMasked, type TerrainPoint, type TerrainPathMask } from './terrain.ts'

describe('terrain paths and visibility masks', () => {
  const points: TerrainPoint[] = [[0, 0, 10], [3, 0, 14], [3, 12, 14]]
  it('uses 3D arc length and preserves bends and elevation', () => {
    const distances = terrainPathDistances(points)
    expect(distances).toEqual([0, 5, 17])
    expect(terrainPathPoint(points, distances, 5 / 17)).toEqual(points[1])
    expect(terrainPathPoint(points, distances, 11 / 17)).toEqual([3, 6, 14])
    expect(terrainPathPoint(points, distances, -1)).toEqual(points[0])
    expect(terrainPathPoint(points, distances, 2)).toEqual(points[2])
    const reversed = [...points].reverse()
    expect(terrainPathPoint(reversed, terrainPathDistances(reversed), 6 / 17)).toEqual([3, 6, 14])
  })
  it('handles singleton paths and rejects missing samples and non-finite progress', () => {
    expect(terrainPathDistances([])).toEqual([])
    expect(terrainPathPoint([points[0]], [0], .5)).toEqual(points[0])
    expect(() => terrainPathPoint([], [], 0)).toThrow()
    expect(() => terrainPathPoint(points, [], 0)).toThrow()
    expect(() => terrainPathPoint(points, [0, 5, 17], NaN)).toThrow()
  })
  it('keeps inclusive mask boundaries and source evidence', () => {
    const masks: TerrainPathMask[] = [{ start: .2, end: .4, names: ['Source tunnel'], kinds: ['tunnel'], reason: 'tunnel' }]
    expect(terrainMaskAt(masks, .2)).toBe(masks[0])
    expect(terrainMaskAt(masks, .4)).toBe(masks[0])
    expect(terrainMaskAt(masks, .5)).toBeUndefined()
    expect(terrainSegmentMasked(masks, 0, .2)).toBe(true)
    expect(terrainSegmentMasked(masks, .4, .6)).toBe(true)
    expect(terrainSegmentMasked(masks, .41, .6)).toBe(false)
  })
})
