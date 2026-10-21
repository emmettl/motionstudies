import type { BoundaryCoordinate } from '@motionstudies/core/domain/boundary'
import type { NetworkTrain } from '@motionstudies/core/domain/network'
import type { NetworkProjection } from './NationalNetworkScene.tsx'
import type { ProjectedStop } from './station-picking.ts'
import { projectedPathRunsForward, type ProjectedNetworkPath } from './network-paths.ts'
import { lakeAvoidingPathForStops, type LakeAvoidingPathMap } from './lake-aware-paths.ts'

const EMPTY_LAKE_AVOIDING_PATHS: LakeAvoidingPathMap = new Map()

export function projectCoordinate(
  [longitude, latitude]: BoundaryCoordinate,
  projection: NetworkProjection,
  height = 0,
): ProjectedStop {
  return [
    (longitude - projection.centreLongitude) * projection.longitudeScale * projection.scale,
    height,
    -(latitude - projection.centreLatitude) * projection.scale,
  ]
}

export function segmentPoints(
  train: NetworkTrain,
  segmentIndex: number,
  projectedStops: readonly ProjectedStop[],
  projectedPaths: readonly ProjectedNetworkPath[],
  lakeAvoidingPaths: LakeAvoidingPathMap = EMPTY_LAKE_AVOIDING_PATHS,
): readonly ProjectedStop[] {
  const pathIndex = train.pathSegments?.[segmentIndex]
  if (pathIndex !== undefined && pathIndex !== null) {
    const path = projectedPaths[pathIndex]
    if (path?.points.length) {
      const fromIndex = train.stops[segmentIndex]?.[0]
      const from = fromIndex === undefined ? undefined : projectedStops[fromIndex]
      if (!from || projectedPathRunsForward(path, from)) return path.points
      return [...path.points].reverse()
    }
  }
  const fromIndex = train.stops[segmentIndex]?.[0]
  const toIndex = train.stops[segmentIndex + 1]?.[0]
  if (fromIndex === undefined || toIndex === undefined) return []
  const detour = lakeAvoidingPathForStops(
    lakeAvoidingPaths,
    fromIndex,
    toIndex,
  )
  if (detour) return detour.points
  const from = projectedStops[fromIndex]
  const to = projectedStops[toIndex]
  return from && to ? [from, to] : []
}

export function appendLineSegments(
  positions: number[],
  points: readonly ProjectedStop[],
  height: number,
) {
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]
    const to = points[index]
    positions.push(from[0], height, from[2], to[0], height, to[2])
  }
}

export function routeSegmentKey(train: NetworkTrain, segmentIndex: number): string {
  const fromIndex = train.stops[segmentIndex]?.[0]
  const toIndex = train.stops[segmentIndex + 1]?.[0]
  const pathIndex = train.pathSegments?.[segmentIndex]
  if (pathIndex !== undefined && pathIndex !== null) return `path:${pathIndex}`
  if (fromIndex === undefined || toIndex === undefined) {
    return `missing:${train.id}:${segmentIndex}`
  }
  return fromIndex < toIndex
    ? `${fromIndex}:${toIndex}`
    : `${toIndex}:${fromIndex}`
}

export function offsetProjectedPath(
  points: readonly ProjectedStop[],
  offset: number,
): readonly ProjectedStop[] {
  if (!offset || points.length < 2) return points
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)]
    const next = points[Math.min(points.length - 1, index + 1)]
    const tangentX = next[0] - previous[0]
    const tangentZ = next[2] - previous[2]
    const length = Math.hypot(tangentX, tangentZ)
    if (!length) return point
    return [
      point[0] - (tangentZ / length) * offset,
      point[1],
      point[2] + (tangentX / length) * offset,
    ]
  })
}

