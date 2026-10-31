import type { TerrainBounds } from './terrain-raster.mjs'
export type ProjectedPoint = [number, number]
export function clipRingToBounds(ring: ProjectedPoint[], bounds: TerrainBounds): ProjectedPoint[]
export function pointInRing(point: ProjectedPoint, ring: ProjectedPoint[]): boolean
