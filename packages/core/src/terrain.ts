/** Local coordinates in metres: easting offset, southward offset, elevation. */
export type TerrainPoint = [number, number, number]

/** Vertex samples, row-major from north to south. Extents span first to last sample. */
export interface TerrainGrid {
  rows: number
  columns: number
  widthMetres: number
  depthMetres: number
  elevations: ArrayLike<number>
}

/** Presentation/visibility mask along a path; never a hydraulic obstruction. */
export interface TerrainPathMask {
  start: number
  end: number
  names: string[]
  kinds: string[]
  reason: 'tunnel' | 'covered' | 'alignment'
}

/** Cumulative 3D distance, preserving the supplied alignment and vertical datum. */
export function terrainPathDistances(points: readonly TerrainPoint[]): number[] {
  const distances = [0]
  for (let i = 1; i < points.length; i++) distances.push(distances[i - 1] + Math.hypot(...points[i].map((n, j) => n - points[i - 1][j])))
  return points.length ? distances : []
}

/** Interpolate by fraction of 3D path length. Callers may cache distances per path. */
export function terrainPathPoint(points: readonly TerrainPoint[], distances: readonly number[], progress: number): TerrainPoint {
  if (!points.length || distances.length !== points.length || !Number.isFinite(progress)) throw new Error('Invalid terrain path query')
  if (points.length === 1) return [...points[0]]
  const d = Math.max(0, Math.min(1, progress)) * distances.at(-1)!
  let lo = 1, hi = distances.length - 1
  while (lo < hi) { const mid = (lo + hi) >> 1; if (distances[mid] < d) lo = mid + 1; else hi = mid }
  const t = (d - distances[lo - 1]) / (distances[lo] - distances[lo - 1] || 1)
  return points[lo - 1].map((n, i) => n + (points[lo][i] - n) * t) as TerrainPoint
}

export function terrainMaskAt(masks: readonly TerrainPathMask[], progress: number): TerrainPathMask | undefined {
  return masks.find(mask => progress >= mask.start && progress <= mask.end)
}

/** Inclusive intersection: a segment touching a masked boundary stays hidden. */
export function terrainSegmentMasked(masks: readonly TerrainPathMask[], start: number, end: number): boolean {
  return masks.some(mask => mask.start <= end && mask.end >= start)
}
