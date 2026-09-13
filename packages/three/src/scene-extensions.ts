import { useContext, type ComponentType } from 'react'
import { NetworkSceneProviderContext } from './scene-context.ts'
import type { Camera, PerspectiveCamera, Scene, Vector3 } from 'three'
import type { NetworkSnapshot, NetworkTrain } from '@motionstudies/core/domain/network'
import type { RoadTopologySnapshot } from '@motionstudies/core/domain/road'
import type { NationalRoadStudySnapshot } from '@motionstudies/core/domain/road-day'
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

export interface DiagramStationsProps {
  readonly snapshot: NetworkSnapshot
  readonly projectedStops: readonly ProjectedPoint[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly routeColors: Readonly<Record<string, string>>
  readonly opacity: number
}

export interface RoadOverlayProps {
  readonly topology: RoadTopologySnapshot
  readonly snapshot?: NationalRoadStudySnapshot
  readonly projection: NetworkProjection
  readonly subdued: boolean
  readonly selectedRoadId?: string
}

export interface AircraftPickEvent {
  readonly scene: Scene
  readonly camera: Camera
  readonly canvas: HTMLCanvasElement
  readonly clientX: number
  readonly clientY: number
  readonly touch: boolean
  readonly dragDistance: number
}
export interface AircraftPickingPolicy {
  /** Omission retains the existing pointer-down selection behaviour. */
  readonly event?: 'click' | 'pointerdown'
  readonly accepts?: (event: AircraftPickEvent) => boolean
}

export interface NetworkSceneExtensions {
  /** Use a child component for selection instead of the built-in station targets. */
  readonly stationPicking?: 'default' | 'custom'
  readonly aircraftPicking?: AircraftPickingPolicy
  readonly DiagramStations?: ComponentType<DiagramStationsProps>
  readonly RoadOverlay?: ComponentType<RoadOverlayProps>
  /** Applied only to line-map route geometry; geographical route behaviour is unchanged. */
  readonly diagramSegmentKey?: (train: NetworkTrain, segment: number, stops: readonly ProjectedPoint[]) => string
  readonly diagramOrderedPoints?: (points: readonly ProjectedPoint[]) => readonly ProjectedPoint[]
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
