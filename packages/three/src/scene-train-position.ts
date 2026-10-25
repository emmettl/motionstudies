import { type ProjectedStop } from './station-picking.ts'
import { useMemo } from 'react'
import { useNetworkScene } from './scene-extensions.ts'
import { COPLANAR_MAP_SURFACE_Y } from './scene-style.ts'
import * as THREE from 'three'
import { positionForTrain, type NetworkTrain } from '@motionstudies/core/domain/network'
import {
  pointAlongProjectedPath,
  pointAlongProjectedPathFrom,
  type ProjectedNetworkPath,
} from './network-paths.ts'
import { lakeAvoidingPathForStops, type LakeAvoidingPathMap } from './lake-aware-paths.ts'
import { EMPTY_LAKE_AVOIDING_PATHS } from './scene-lake-paths.ts'

export function projectedTrainPosition(
  train: NetworkTrain,
  time: number,
  projectedStops: readonly ProjectedStop[],
  projectedPaths: readonly ProjectedNetworkPath[] = [],
  lakeAvoidingPaths: LakeAvoidingPathMap = EMPTY_LAKE_AVOIDING_PATHS,
): ProjectedStop | undefined {
  const position = positionForTrain(train, time)
  if (!position) return undefined
  const pathIndex =
    position.segmentIndex === undefined
      ? undefined
      : train.pathSegments?.[position.segmentIndex]
  const path =
    pathIndex === undefined || pathIndex === null
      ? undefined
      : projectedPaths[pathIndex]
  if (path) {
    const from = projectedStops[position.fromStop]
    const point = from
      ? pointAlongProjectedPathFrom(path, position.progress, from)
      : pointAlongProjectedPath(path, position.progress)
    if (point) return [point[0], 0.2, point[2]]
  }
  const detour = lakeAvoidingPathForStops(
    lakeAvoidingPaths,
    position.fromStop,
    position.toStop,
  )
  if (detour) {
    const point = pointAlongProjectedPath(detour, position.progress)
    if (point) return [point[0], 0.2, point[2]]
  }
  const from = projectedStops[position.fromStop]
  const to = projectedStops[position.toStop]
  if (!from || !to) return undefined
  return [
    THREE.MathUtils.lerp(from[0], to[0], position.progress),
    0.2,
    THREE.MathUtils.lerp(from[2], to[2], position.progress),
  ]
}

export function useProjectedTrainPosition() {
  const { props } = useNetworkScene()
  const resolver = props.extensions?.trainPosition
  const elevation = props.mapStyle?.vehicleElevation ?? (props.mapStyle?.coplanar ? COPLANAR_MAP_SURFACE_Y : undefined)
  return useMemo(() => {
    if (!resolver && elevation === undefined) return projectedTrainPosition
    return (...args: Parameters<typeof projectedTrainPosition>): ProjectedStop | undefined => {
      const result = resolver?.(args[0], args[1], args[2], args[3] ?? [], args[4] ?? EMPTY_LAKE_AVOIDING_PATHS)
      const point = result === undefined ? projectedTrainPosition(...args) : result ?? undefined
      return point && elevation !== undefined ? [point[0], elevation, point[2]] : point
    }
  }, [resolver, elevation])
}

