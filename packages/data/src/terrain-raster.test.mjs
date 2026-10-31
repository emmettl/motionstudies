import { describe, expect, it } from 'vitest'
import { rasterWindow, sampleRaster, rasterToTerrainGrid } from './terrain-raster.mjs'
const raster = { origin: [100, 200], resolution: [10, -10], window: [0, 0], width: 2, height: 2, values: [400, 500, 600, 700] }
const bounds = { minEasting: 105, maxEasting: 115, minNorthing: 185, maxNorthing: 195 }
describe('bounded terrain raster operations', () => {
  it('samples native centres, interiors, edges and cached offsets', () => {
    expect(sampleRaster(raster, 105, 195)).toBe(400)
    expect(sampleRaster(raster, 115, 185)).toBe(700)
    expect(sampleRaster(raster, 110, 190)).toBe(550)
    expect(sampleRaster({ ...raster, window: [2, 3] }, 125, 165)).toBe(400)
  })
  it('keeps nodata and physical elevation policy with the caller', () => {
    const belowSea = { ...raster, values: [-10, -20, -30, -40] }
    expect(sampleRaster(belowSea, 110, 190)).toBe(-25)
    expect(() => sampleRaster(belowSea, 110, 190, h => h >= 0 && h <= 5000)).toThrow('Invalid terrain sample')
    expect(() => sampleRaster({ ...raster, values: [-9999, 500, 600, 700] }, 114, 186, h => h !== -9999)).toThrow()
    expect(() => sampleRaster({ ...raster, values: [NaN, 500, 600, 700] }, 110, 190)).toThrow()
  })
  it('fails closed on missing coverage and malformed raster/query metadata', () => {
    expect(() => sampleRaster(raster, 100, 195)).toThrow('outside cached raster')
    expect(() => sampleRaster(raster, NaN, 190)).toThrow()
    expect(() => sampleRaster({ ...raster, resolution: [0, -10] }, 110, 190)).toThrow()
    expect(() => sampleRaster({ ...raster, values: [] }, 110, 190)).toThrow()
  })
  it('builds rectangular north-down grids without rounding source heights', () => {
    expect(rasterToTerrainGrid(raster, bounds, 3, 2)).toEqual({ columns: 3, rows: 2, widthMetres: 10, depthMetres: 10, elevations: [400, 450, 500, 600, 650, 700] })
    expect(() => rasterToTerrainGrid(raster, bounds, 1, 2)).toThrow()
  })
  it('computes padded range-request windows independently of native resolution', () => {
    expect(rasterWindow(bounds, raster.origin, raster.resolution)).toEqual([-2, -2, 4, 4])
    expect(rasterWindow(bounds, raster.origin, [2, -2], 1)).toEqual([1, 1, 9, 9])
    expect(() => rasterWindow(bounds, raster.origin, [10, 10])).toThrow()
    expect(() => rasterWindow(bounds, [100], [10, -10])).toThrow()
  })
})
