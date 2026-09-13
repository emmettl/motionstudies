import { useContext } from 'react'
import { NetworkSceneProviderContext } from './scene-context.ts'
import type { PerspectiveCamera, Vector3 } from 'three'
import type { NetworkTrain } from '@motionstudies/core/domain/network'
import type { nationalRoadConditionsAtTime } from '@motionstudies/core/domain/road-day'
import type { NationalNetworkSceneProps, NetworkProjection } from './NationalNetworkScene.tsx'
import type { ProjectedNetworkPath } from './network-paths.ts'
import type { LakeAvoidingPathMap } from './lake-aware-paths.ts'

export type ProjectedPoint = readonly [x: number, y: number, z: number]
export type { ProjectedNetworkPath, LakeAvoidingPathMap }

/** Return undefined to use the renderer's interpolation, or null to hide the journey. */
export type TrainPositionResolver = (
  train: NetworkTrain, time: number, stops: readonly ProjectedPoint[],
  paths: readonly ProjectedNetworkPath[], detours: LakeAvoidingPathMap,
) => ProjectedPoint | null | undefined

export interface TrailDataset {
  readonly trains: readonly NetworkTrain[]
  readonly stops: readonly ProjectedPoint[]
  readonly paths: readonly ProjectedNetworkPath[]
  readonly detours: readonly (readonly [string, ProjectedNetworkPath])[]
  readonly colors: readonly (readonly number[])[]
}

/** Three history segments, with counts expressed in line segments (two vertices each). */
export interface TrailFrame {
  readonly positions: readonly Float32Array[]
  readonly colors: readonly Float32Array[]
  readonly counts: readonly number[]
}

/** Optional asynchronous trail computation. The renderer retains synchronous fallback.
 * select must invalidate late results when its key or visibility changes. reset must
 * discard the previous dataset. dispose must be idempotent and permit a later reset.
 */
export interface TrailBackend {
  readonly available: boolean
  reset(data: () => TrailDataset): void
  select(key: object, visibility: string): void
  submit(time: number, trainIds: string[]): void
  takeFrame(): TrailFrame | undefined
  dispose(): void
}

export interface NetworkCameraContext {
  readonly camera: PerspectiveCamera
  /** Mutable target owned by the renderer; retain this object when handing control back. */
  readonly target: Vector3
  readonly projection: NetworkProjection
}
export interface NetworkCameraDriver {
  /** Return true when the driver owns this frame; false resumes the standard camera. */
  update(delta: number): boolean
  dispose(): void
}

export interface NetworkSceneExtensions {
  readonly trainPosition?: TrainPositionResolver
  readonly roadConditions?: typeof nationalRoadConditionsAtTime
  /** Pure constructor; reset/dispose are called by the renderer's effect lifecycle. */
  readonly createTrailBackend?: () => TrailBackend
  /** Registered after mount and disposed on replacement, projection changes or unmount. */
  readonly createCameraDriver?: (context: NetworkCameraContext) => NetworkCameraDriver
}

export interface NetworkSceneContext {
  readonly props: NationalNetworkSceneProps
  readonly projection: NetworkProjection
  readonly projectedStops: readonly ProjectedPoint[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly lakeAvoidingPaths: LakeAvoidingPathMap
}

/** Use in a component rendered as NationalNetworkScene children, inside its R3F Canvas.
 * Projected data is read-only and follows the active spatial layout. Use props.time
 * for UI state; a continuously animated layer may follow the same playback contract
 * with useFrame. It must not start a second onTime reporter.
 */
export function useNetworkScene(): NetworkSceneContext {
  const context = useContext(NetworkSceneProviderContext)
  if (!context) throw new Error('useNetworkScene requires a NationalNetworkScene child')
  return context
}
