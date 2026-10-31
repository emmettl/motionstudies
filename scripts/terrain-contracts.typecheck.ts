// Compiled only inside the isolated packed consumer, including data's handwritten declarations.
import { terrainPathDistances, terrainPathPoint, terrainMaskAt, type TerrainGrid, type TerrainPoint, type TerrainPathMask } from '@motionstudies/core/terrain'
import { sampleRaster, rasterWindow, rasterToTerrainGrid, type TerrainRaster } from '@motionstudies/data/terrain-raster'
import { clipRingToBounds, pointInRing, type ProjectedPoint } from '@motionstudies/data/terrain-water'
import { createTerrainGeometry, createHeightfieldSurface, type HeightfieldSurfaceOptions } from '@motionstudies/three/terrain-surface'
import { DataTexture } from 'three'

const raster: TerrainRaster = { origin: [0, 20], resolution: [10, -10], window: [0, 0], width: 2, height: 2, values: new Float64Array([1, 2, 3, 4]) }
const bounds = { minEasting: 5, maxEasting: 15, minNorthing: 5, maxNorthing: 15 }
export const height: number = sampleRaster(raster, 10, 10, Number.isFinite)
export const window: [number, number, number, number] = rasterWindow(bounds, raster.origin, raster.resolution)
export const grid: TerrainGrid = rasterToTerrainGrid(raster, bounds, 2, 2)
export const geometry = createTerrainGeometry(grid, { metresPerUnit: 100, elevationDatum: 1 })
const texture = new DataTexture()
const options: HeightfieldSurfaceOptions = { channel: 3, rowOrder: 'south-to-north', verticalExaggeration: 3 }
export const surface = createHeightfieldSurface(grid, () => texture, options)
const points: TerrainPoint[] = [[0, 0, 1], [3, 4, 2]]
export const point: TerrainPoint = terrainPathPoint(points, terrainPathDistances(points), .5)
const masks: TerrainPathMask[] = [{ start: .2, end: .4, names: ['Example'], kinds: ['covered'], reason: 'covered' }]
export const mask: TerrainPathMask | undefined = terrainMaskAt(masks, .3)
export const ring: ProjectedPoint[] = clipRingToBounds([[0, 0], [20, 0], [20, 20], [0, 20]], bounds)
export const inside: boolean = pointInRing([10, 10], ring)
