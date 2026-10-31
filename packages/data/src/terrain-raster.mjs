/** Generic bounded raster operations. CRS, datum, nodata and source bounds are caller policy. */
export function rasterWindow(bounds, origin, resolution, padding = 2) {
  if (![bounds.minEasting, bounds.maxEasting, bounds.minNorthing, bounds.maxNorthing, origin[0], origin[1], resolution[0], resolution[1]].every(Number.isFinite) || bounds.minEasting >= bounds.maxEasting || bounds.minNorthing >= bounds.maxNorthing || resolution[0] <= 0 || resolution[1] >= 0 || !Number.isInteger(padding) || padding < 0) throw new Error('Invalid north-down raster window')
  return [Math.floor((bounds.minEasting - origin[0]) / resolution[0]) - padding, Math.floor((bounds.maxNorthing - origin[1]) / resolution[1]) - padding, Math.ceil((bounds.maxEasting - origin[0]) / resolution[0]) + padding, Math.ceil((bounds.minNorthing - origin[1]) / resolution[1]) + padding]
}

/** Bilinear interpolation at pixel centres; no extrapolation or silent nodata filling. */
export function sampleRaster(raster, easting, northing, valid = Number.isFinite) {
  if (!Number.isInteger(raster.width) || !Number.isInteger(raster.height) || raster.width < 1 || raster.height < 1 || raster.values.length !== raster.width * raster.height || ![raster.origin[0], raster.origin[1], raster.resolution[0], raster.resolution[1], raster.window[0], raster.window[1], easting, northing].every(Number.isFinite) || !raster.resolution[0] || !raster.resolution[1]) throw new Error('Invalid raster query')
  const x = (easting - raster.origin[0]) / raster.resolution[0] - .5 - raster.window[0]
  const y = (northing - raster.origin[1]) / raster.resolution[1] - .5 - raster.window[1]
  if (x < 0 || y < 0 || x > raster.width - 1 || y > raster.height - 1) throw new Error('Elevation query outside cached raster')
  const a = Math.floor(x), b = Math.floor(y), tx = x - a, ty = y - b
  const at = (c, r) => {
    const value = raster.values[Math.min(r, raster.height - 1) * raster.width + Math.min(c, raster.width - 1)]
    if (!Number.isFinite(value) || !valid(value)) throw new Error('Invalid terrain sample')
    return value
  }
  return (at(a, b) * (1 - tx) + at(a + 1, b) * tx) * (1 - ty) + (at(a, b + 1) * (1 - tx) + at(a + 1, b + 1) * tx) * ty
}

/** Vertex grid spanning bounds, in the north-to-south order used by terrain meshes. */
export function rasterToTerrainGrid(raster, bounds, columns, rows, valid = Number.isFinite) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 2 || ![bounds.minEasting, bounds.maxEasting, bounds.minNorthing, bounds.maxNorthing].every(Number.isFinite) || bounds.minEasting >= bounds.maxEasting || bounds.minNorthing >= bounds.maxNorthing) throw new Error('Invalid terrain grid')
  const widthMetres = bounds.maxEasting - bounds.minEasting, depthMetres = bounds.maxNorthing - bounds.minNorthing
  const elevations = Array.from({ length: columns * rows }, (_, i) => sampleRaster(raster, bounds.minEasting + i % columns * widthMetres / (columns - 1), bounds.maxNorthing - Math.floor(i / columns) * depthMetres / (rows - 1), valid))
  return { columns, rows, widthMetres, depthMetres, elevations }
}
