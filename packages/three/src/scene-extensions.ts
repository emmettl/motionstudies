import type { RoadTrafficLayerProps } from './RoadTrafficLayer.tsx'
import type { SpatialMorphProjection } from './spatial-morph.ts'
import type { CameraViewportPolicy } from './map-camera.ts'
export type { CameraViewportPolicy, CameraViewportState, CameraViewportFrame } from './map-camera.ts'
import { useContext, type ComponentType } from 'react'
import { useRequireWebGL } from './webgl-study.ts'
import { NetworkSceneProviderContext } from './scene-context.ts'
import type { Camera, PerspectiveCamera, Scene, Vector3 } from 'three'
import type { NetworkSnapshot, NetworkTrain, StationIndexEntry } from '@motionstudies/core/domain/network'
import type { RoadTopologySnapshot } from '@motionstudies/core/domain/road'
import type { NationalRoadStudySnapshot } from '@motionstudies/core/domain/road-day'
import type { nationalRoadConditionsAtTime } from '@motionstudies/core/domain/road-day'
import type { NationalNetworkSceneProps, NetworkProjection, MapCameraCommand } from './NationalNetworkScene.tsx'
import type { ProjectedNetworkPath } from './network-paths.ts'
import type { LakeAvoidingPathMap } from './lake-aware-paths.ts'

export type ProjectedPoint = readonly [x: number, y: number, z: number]
export type { ProjectedNetworkPath, LakeAvoidingPathMap }

/** Return undefined to use the renderer's interpolation, or null to hide the journey. */
export type TrainPositionResolver = (
  train: NetworkTrain, time: number, stops: readonly ProjectedPoint[],
  paths: readonly ProjectedNetworkPath[], detours: LakeAvoidingPathMap,
) => ProjectedPoint | null | undefined

export interface NetworkCameraContext {
  readonly camera: PerspectiveCamera
  /** Mutable target owned by the renderer; retain this object when handing control back. */
  readonly target: Vector3
  readonly projection: NetworkProjection
}
export interface NetworkCameraDriver {
  /** Notified once after a new command resolves the standard map target; never retain that target. */
  onCommand?(command: MapCameraCommand, station: StationIndexEntry | undefined, target: Vector3): void
  /** Pointer-down/wheel intent releases authored focus, even when selection suppresses movement. */
  onGesture?(): void
  /** Prepare the standard map target in place. Return an interpolation fraction, or undefined for default damping.
   * Called only on standard frames; do not retain the renderer-owned target or stop array. */
  prepareFrame?(target: Vector3, stops: readonly ProjectedPoint[], spatialLayoutMix: number, delta: number, following: boolean): number | undefined
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
  /** Topology-preserving world-space morph for network and geographic context geometry.
   * Replaces spatialLayout when configured; source geometry stays mounted and owned by the renderer. */
  readonly spatialMorph?: SpatialMorphProjection
  /** Standard-camera projection framing. Stable callback; driver-owned frames remain untouched. */
  readonly cameraViewport?: CameraViewportPolicy
  /** Use a child component for selection instead of the built-in station targets. */
  readonly stationPicking?: 'default' | 'custom'
  /** Called after tap/drag validation and before built-in station picking. */
  readonly acceptsStationPick?: (event: AircraftPickEvent) => boolean
  readonly aircraftPicking?: AircraftPickingPolicy
  readonly DiagramStations?: ComponentType<DiagramStationsProps>
  readonly RoadOverlay?: ComponentType<RoadOverlayProps>
  /** Optional lazy road composition using the supported RoadTrafficLayer and its explicit inputs. */
  readonly RoadLayer?: ComponentType<RoadTrafficLayerProps>
  /** Applied only to line-map route geometry; geographical route behaviour is unchanged. */
  readonly diagramSegmentKey?: (train: NetworkTrain, segment: number, stops: readonly ProjectedPoint[]) => string
  readonly diagramOrderedPoints?: (points: readonly ProjectedPoint[]) => readonly ProjectedPoint[]
  readonly trainPosition?: TrainPositionResolver
  readonly roadConditions?: typeof nationalRoadConditionsAtTime
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
  useRequireWebGL('NationalNetworkScene extension')
  const context = useContext(NetworkSceneProviderContext)
  if (!context) throw new Error('useNetworkScene requires a NationalNetworkScene child')
  return context
}
