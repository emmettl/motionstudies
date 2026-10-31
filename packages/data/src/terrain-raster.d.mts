export interface TerrainBounds { minEasting: number; maxEasting: number; minNorthing: number; maxNorthing: number }
export interface TerrainRaster { origin: number[]; resolution: number[]; window: number[]; width: number; height: number; values: ArrayLike<number> }
export function rasterWindow(bounds: TerrainBounds, origin: number[], resolution: number[], padding?: number): [number, number, number, number]
export function sampleRaster(raster: TerrainRaster, easting: number, northing: number, valid?: (value: number) => boolean): number
export function rasterToTerrainGrid(raster: TerrainRaster, bounds: TerrainBounds, columns: number, rows: number, valid?: (value: number) => boolean): { columns: number; rows: number; widthMetres: number; depthMetres: number; elevations: number[] }
