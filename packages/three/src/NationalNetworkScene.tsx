import { useCameraFrame } from './use-camera-frame.ts'
import { frameRenderer } from './frame-state.ts'
import { frameElapsed } from './frame-state.ts'
import { MAP_LAYER } from './scene-layer-order.ts'
import { EMPTY_LAKE_AVOIDING_PATHS, LakeAvoidingPathsContext } from './scene-lake-paths.ts'
import { useProjectedTrainPosition } from './scene-train-position.ts'
import { StationLabels, TrainLabels } from './scene-labels.tsx'
import {
  SelectedRoute,
  SelectedLinePaths,
  SelectedStationRoutes,
  SelectedTrainMarker,
} from './scene-selection-layers.tsx'
import { mapSurfaceY } from './scene-surface.ts'
import {
  NationalGround,
  LakeLayer,
  DiagramWaterLayer,
  ReferencePathLayer,
  CountryBorder,
} from './scene-context-layers.tsx'
import { RailGraph } from './scene-rail-layers.tsx'
import { useMapStyle } from './scene-map-style.ts'
import { projectCoordinate } from './scene-path-geometry.ts'
import { trainLightTexture } from './scene-light-texture.ts'
import { projectSpatialMorph } from './spatial-morph.ts'
import { StationTapTarget } from './StationTapTarget.tsx'
import { stationCentre, type ProjectedStop } from './station-picking.ts'
import { setSceneMotionClock, setScenePickTrain } from './scene-picking.ts'
import { TrailFrameBudget } from './trail-frame-budget.ts'
import { updateDirtyGeometry } from './active-geometry.ts'
import { WebGLStudyCanvas as Canvas, useWebGLStudyFrame as useFrame, useWebGLStudyState as useThree, useRequireWebGL } from './webgl-study.ts'
import { lazy, Suspense, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useNetworkScene, type NetworkSceneExtensions, type NetworkCameraDriver } from './scene-extensions.ts'
import { NetworkSceneProviderContext } from './scene-context.ts'
import {
  networkRouteColor as mixedRouteColor,
  COPLANAR_MAP_SURFACE_Y,
  type NetworkMapStyle,
} from './scene-style.ts'
import * as THREE from 'three'
import type { BoundaryCoordinate, MapBoundary } from '@motionstudies/core/domain/boundary'
import type { StudyAirport } from '@motionstudies/core/domain/airport'
import type { MapWaterBodies } from '@motionstudies/core/domain/lakes'
import type { MapReferencePaths } from '@motionstudies/core/domain/map-reference'
import type { SpatialLayoutSnapshot } from '@motionstudies/core/domain/spatial-layout'
import type { RoadTopologySnapshot, RoadTrafficSnapshot } from '@motionstudies/core/domain/road'
import type { NationalRoadStudySnapshot } from '@motionstudies/core/domain/road-day'
import { positionForAirTrack, type AirSnapshot, type AirTrack } from '@motionstudies/core/domain/air'
import {
  positionForTrain,
  type NetworkSnapshot,
  type NetworkRouteIndexEntry,
  type NetworkTrain,
  type ServiceCategory,
  type StationIndexEntry,
} from '@motionstudies/core/domain/network'
import { SERVICE_COLORS } from '@motionstudies/core/theme'
import { buildTrainTimeIndex, type TrainTimeIndex } from '@motionstudies/core/domain/train-time-index'
import { type TrainLabelMode } from './train-labels.ts'
import { VEHICLE_TRAIL_SEGMENTS, VEHICLE_TRAIL_STEP_SECONDS } from './vehicle-trails.ts'
import {
  VEHICLE_TRAIL_HISTORY_LENGTH,
  VEHICLE_TRAIL_HISTORY_STEP_SECONDS,
  trailGridStart,
} from './vehicle-history.ts'
import {
  MOTION_CULLED,
  MOTION_HIDDEN,
  MOTION_MOVING,
  MOTION_STALE,
  MOTION_TERMINAL,
  VehicleMotionTable,
  type MotionState,
} from './vehicle-motion.ts'
import {
  CONVERGE_BUDGET_MS,
  MotionCycle,
  MotionFrameBudget,
  TRAIL_SETTLE_SECONDS,
  motionLookahead,
  motionStaleSeconds,
} from './motion-schedule.ts'
import { createMotionLerp, createMotionUniforms } from './motion-lerp.ts'
import {
  boundsContain,
  createGroundBounds,
  expandBounds,
  groundViewBounds,
  segmentTouchesBounds,
  type GroundBounds,
} from './view-culling.ts'
import {
  applyMapZoom,
  ATLAS_MAP_FRAMING,
  homeMapDistanceScale,
  mapCameraDampingRate,
  mapCameraFieldOfView,
  mapPanScale,
  mapSelectionNeedsReveal,
  mapWheelZoomMultiplier,
  minimumMapDistanceScale,
  type MapCameraFraming,
  createCameraViewportFraming,
} from './map-camera.ts'
import { prepareProjectedPath, type ProjectedNetworkPath } from './network-paths.ts'
import { createLakeAvoidingPathMap } from './lake-aware-paths.ts'
import { vehicleIsVisibleAtZoom } from './regional-lod.ts'
import { projectAirPosition } from './air-projection.ts'
import { createGlowPointTexture } from './glow-point-texture.ts'
import { blendProjectedSpatialLayout, projectSpatialLayout } from './spatial-layout.ts'

const AirTrafficLayer = lazy(() => import('./AirTrafficLayer.tsx').then(module => ({ default: module.AirTrafficLayer })))
const AirportMarker = lazy(() => import('./AirTrafficLayer.tsx').then(module => ({ default: module.AirportMarker })))
const DefaultRoadLayer = lazy(() => import('./RoadTrafficLayer.tsx').then(module => ({ default: module.RoadTrafficLayer })))

export type MapCameraAction =
  | 'zoom-in'
  | 'zoom-out'
  | 'reset'
  | 'reveal-station'
  | 'focus-road'
  | 'focus-location'

export interface MapCameraCommand {
  readonly id: number
  readonly action: MapCameraAction
  readonly focus?: readonly [longitude: number, latitude: number]
  readonly distanceScale?: number
}

export interface NationalNetworkSceneProps {
  /** Complete route reference for infrastructure; stop/path indexes must match snapshot. */
  readonly infrastructureSnapshot?: NetworkSnapshot
  readonly mapStyle?: NetworkMapStyle
  /** Edition-owned scene components, mounted inside the map Canvas before moving vehicles. */
  readonly children?: ReactNode
  readonly extensions?: NetworkSceneExtensions
  /** Allows an external scene handover to suspend rendering without unmounting the map. */
  readonly frameloop?: 'always' | 'demand' | 'never'

  /** Optional geographic position, hidden while the map morphs to a diagram. */
  readonly userLocation?: { readonly longitude: number; readonly latitude: number }
  /** Quiet removes the reference grid while retaining the ground plane. */
  readonly groundStyle?: 'grid' | 'quiet'
  readonly boundary?: MapBoundary
  readonly lakes?: MapWaterBodies
  readonly referencePaths?: MapReferencePaths
  readonly snapshot: NetworkSnapshot
  readonly referenceSnapshot: NetworkSnapshot
  readonly contextSnapshot?: NetworkSnapshot
  readonly isPlaying: boolean
  readonly time: number
  readonly selectedTrain?: NetworkTrain
  /** A small set of simultaneous journeys to compare without choosing a single train. */
  readonly comparisonTrains?: readonly NetworkTrain[]
  readonly comparisonColors?: readonly string[]
  /** Reports the scene clock while playing; paused scenes follow `time` without emitting. */
  readonly onTime: (time: number) => void
  readonly cameraCommand?: MapCameraCommand
  readonly playbackRate: number
  readonly selectedCategory?: ServiceCategory
  readonly selectedRoute?: NetworkRouteIndexEntry
  readonly selectedStation?: StationIndexEntry
  readonly onSelectStation?: (station: StationIndexEntry) => void
  readonly stations: readonly StationIndexEntry[]
  readonly trainLabelMode: TrainLabelMode
  readonly cameraFraming: MapCameraFraming
  readonly airSnapshot?: AirSnapshot
  readonly airCategorySelected?: boolean
  readonly airports?: readonly StudyAirport[]
  readonly roadSnapshot?: RoadTrafficSnapshot
  readonly nationalRoadSnapshot?: NationalRoadStudySnapshot
  readonly roadTopology?: RoadTopologySnapshot
  readonly roadCategorySelected?: boolean
  readonly selectedRoadId?: string
  readonly selectedAirTrack?: AirTrack
  readonly selectedAirport?: StudyAirport
  readonly onSelectAirTrack?: (trackId: string) => void
  readonly spatialLayout?: SpatialLayoutSnapshot
  readonly spatialLayoutMix?: number
  readonly layoutTransitioning?: boolean
  readonly routeColors?: Readonly<Record<string, string>>
  /** Route identity may emerge independently of a spatial-layout morph. */
  readonly routeColorMix?: number
  /** Optional flat, cased network-map treatment for a resolved topological layout. */
  readonly topologicalStyle?: 'luminous' | 'line-map'
  /** Strengthens aggregate edge flow when an edition deliberately pulls back. */
  readonly trafficOverviewEmphasis?: number
  /** Optional edition-authored semantic tier ceiling; selected routes always win. */
  readonly stationLabelTierLimit?: number
  /** Allows slower camera studies to hold a label set until movement truly settles. */
  readonly stationLabelSettleSeconds?: number
}

export interface NetworkProjection {
  readonly centreLongitude: number
  readonly centreLatitude: number
  readonly longitudeScale: number
  readonly scale: number
}

function createNetworkProjection(snapshot: NetworkSnapshot): NetworkProjection {
  const { bounds } = snapshot
  const centreLongitude = (bounds.minLongitude + bounds.maxLongitude) / 2
  const centreLatitude = (bounds.minLatitude + bounds.maxLatitude) / 2
  const longitudeScale = Math.cos((centreLatitude * Math.PI) / 180)
  const projectedWidth =
    (bounds.maxLongitude - bounds.minLongitude) * longitudeScale
  return {
    centreLongitude,
    centreLatitude,
    longitudeScale,
    scale: 51 / projectedWidth,
  }
}

function projectStops(
  snapshot: NetworkSnapshot,
  projection: NetworkProjection,
): readonly ProjectedStop[] {
  return snapshot.stops.map(([longitude, latitude]) =>
    projectCoordinate([longitude, latitude], projection),
  )
}

function projectPaths(
  snapshot: NetworkSnapshot,
  projection: NetworkProjection,
): readonly ProjectedNetworkPath[] {
  return (snapshot.paths ?? []).map((path) =>
    prepareProjectedPath(
      path.map((coordinate) => projectCoordinate(coordinate, projection)),
    ),
  )
}

function realtimeRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const context = canvas.getContext('2d')
  if (context) {
    context.strokeStyle = 'rgba(255, 255, 255, 0.96)'
    context.lineWidth = 7
    context.shadowColor = 'rgba(255, 255, 255, 0.8)'
    context.shadowBlur = 10
    context.beginPath()
    context.arc(48, 48, 30, 0, Math.PI * 2)
    context.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

type VehicleMarkerKind = 'rail' | 'tram' | 'bus'

const VEHICLE_MARKER_KINDS: readonly VehicleMarkerKind[] = [
  'rail',
  'tram',
  'bus',
]

function vehicleMarkerKind(category: ServiceCategory): VehicleMarkerKind {
  if (category === 'tram') return 'tram'
  if (category === 'bus') return 'bus'
  return 'rail'
}

function vehicleGlyphTexture(kind: 'tram' | 'bus'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const context = canvas.getContext('2d')
  if (context) {
    context.strokeStyle = 'rgba(255, 255, 255, 0.98)'
    context.fillStyle = 'rgba(255, 255, 255, 1)'
    context.shadowColor = 'rgba(255, 255, 255, 0.75)'
    context.shadowBlur = 7
    context.lineJoin = 'round'
    context.lineCap = 'round'

    if (kind === 'tram') {
      context.lineWidth = 9
      context.beginPath()
      context.moveTo(48, 17)
      context.lineTo(76, 48)
      context.lineTo(48, 79)
      context.lineTo(20, 48)
      context.closePath()
      context.stroke()
      context.beginPath()
      context.arc(48, 48, 7, 0, Math.PI * 2)
      context.fill()
    } else {
      context.lineWidth = 15
      context.beginPath()
      context.moveTo(25, 48)
      context.lineTo(71, 48)
      context.stroke()
      context.shadowBlur = 0
      context.fillStyle = 'rgba(255, 255, 255, 0.72)'
      context.beginPath()
      context.arc(28, 48, 3.5, 0, Math.PI * 2)
      context.arc(68, 48, 3.5, 0, Math.PI * 2)
      context.fill()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function useVehiclePalette(snapshot: NetworkSnapshot, routeColors: Readonly<Record<string, string>> | undefined,
  routeColorMix: number, categoryColors: NetworkMapStyle['categoryColors']) {
  const palette = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(SERVICE_COLORS).map(([category, color]) => [
          category,
          new THREE.Color(categoryColors?.[category as ServiceCategory] ?? color),
        ]),
      ) as Record<ServiceCategory, THREE.Color>,
    [categoryColors],
  )
  const trainPalette = useMemo(
    () =>
      new Map(
        snapshot.trains.map((train) => [
          train.id,
          new THREE.Color(
            mixedRouteColor(
              train.category,
              train.route,
              routeColors,
              routeColorMix,
              categoryColors,
            ),
          ),
        ]),
      ),
    [categoryColors, routeColorMix, routeColors, snapshot.trains],
  )
  return { palette, trainPalette }
}

/** Journeys whose scheduled chord lies this far outside the view are not sampled. */
const VEHICLE_CULL_MARGIN = 0.3
const VEHICLE_TRAIL_HISTORY_SPAN =
  (VEHICLE_TRAIL_HISTORY_LENGTH - 1) * VEHICLE_TRAIL_HISTORY_STEP_SECONDS
/** History samples one journey may take per refresh once frames are struggling. */
const REDUCED_TRAIL_HISTORY_SAMPLES = 4
/** Playing journeys refresh before their chord ends, so markers never stall at its end. */
const MOTION_REFRESH_FRACTION = 0.8
/** Check elapsed time after this many refreshes; clock reads are not free. */
const MOTION_BUDGET_CHECK = 16

interface MotionBuffers {
  readonly geometry: THREE.BufferGeometry
  readonly from: Float32Array
  readonly to: Float32Array
  readonly times: Float32Array
  readonly color?: Float32Array
  readonly vertices: number
  /** Inclusive changed vertex range for this frame. */
  readonly dirty: [number, number]
  /** Visible journeys drawing into this buffer; zero draws nothing. */
  shown: number
}

function motionBuffers(vertices: number, color: boolean): MotionBuffers {
  const geometry = new THREE.BufferGeometry()
  const from = new Float32Array(vertices * 3)
  const to = new Float32Array(vertices * 3)
  const times = new Float32Array(vertices * 2)
  // A reversed window marks an empty slot.
  for (let vertex = 0; vertex < vertices; vertex += 1) times[vertex * 2] = 1
  geometry.setAttribute('position', new THREE.BufferAttribute(from, 3))
  geometry.setAttribute('positionTo', new THREE.BufferAttribute(to, 3))
  geometry.setAttribute('motionTime', new THREE.BufferAttribute(times, 2))
  const colors = color ? new Float32Array(vertices * 3) : undefined
  if (colors) geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setDrawRange(0, 0)
  return { geometry, from, to, times, color: colors, vertices, dirty: [Infinity, -Infinity], shown: 0 }
}

function markMotionDirty(buffers: MotionBuffers, first: number, last = first) {
  if (first < buffers.dirty[0]) buffers.dirty[0] = first
  if (last > buffers.dirty[1]) buffers.dirty[1] = last
}

function writeMotionVertex(buffers: MotionBuffers, vertex: number, source: Float32Array, fromOffset: number,
  toOffset: number, start: number, end: number) {
  const offset = vertex * 3
  for (let component = 0; component < 3; component += 1) {
    buffers.from[offset + component] = source[fromOffset + component]
    buffers.to[offset + component] = source[toOffset + component]
  }
  buffers.times[vertex * 2] = start
  buffers.times[vertex * 2 + 1] = end
  markMotionDirty(buffers, vertex)
}

function hideMotionVertex(buffers: MotionBuffers, vertex: number) {
  buffers.times[vertex * 2] = 1
  buffers.times[vertex * 2 + 1] = 0
  markMotionDirty(buffers, vertex)
}

function flushMotionBuffers(buffers: MotionBuffers) {
  updateDirtyGeometry(buffers.geometry, buffers.dirty[0], buffers.dirty[1], buffers.shown > 0 ? buffers.vertices : 0)
  buffers.dirty[0] = Infinity
  buffers.dirty[1] = -Infinity
}

interface MotionRefresh {
  readonly now: number
  readonly lookahead: number
  readonly gridEnd: number
  readonly includeTrails: boolean
  readonly cull: GroundBounds | undefined
  readonly maxHistory: number
  readonly viewGeneration: number
}

/**
 * Moving vehicles and their trails. Every journey owns a stable buffer slot
 * and its own study-time window; the GPU moves each vertex across its window
 * every frame. Each frame refreshes only the journeys that are due, within a
 * time budget that adapts to the device, so JavaScript cost per frame stays
 * bounded however many vehicles are in service.
 */
function VehicleMotion({
  snapshot,
  projectedStops,
  projectedPaths,
  selectedTrain,
  comparisonTrains,
  selectedRoute,
  isPlaying,
  time,
  onTime,
  playbackRate,
  selectedCategory,
  airCategorySelected,
  selectedStation,
  cameraFraming,
  routeColors,
  spatialLayoutMix = 0,
  routeColorMix = spatialLayoutMix,
  layoutTransitioning = false,
  motion,
}: NationalNetworkSceneProps & {
  readonly projectedStops: readonly ProjectedStop[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly trainTimeIndex: TrainTimeIndex
  readonly motion: VehicleMotionTable
}) {
  const lakeAvoidingPaths = useContext(LakeAvoidingPathsContext)
  const resolveTrainPosition = useProjectedTrainPosition()
  const mapStyle = useMapStyle()
  const categoryColors = mapStyle.categoryColors
  const flat = mapStyle.surface === 'flat'
  const vehicleElevation = mapStyle.vehicleElevation ?? mapSurfaceY(mapStyle.coplanar, 0.2)
  const trains = snapshot.trains
  const localTime = useRef(time)
  const lastReport = useRef(0)
  const uiFrameBudget = useMemo(() => new TrailFrameBudget(), [])
  const frameBudget = useMemo(() => new MotionFrameBudget(), [])
  const cycle = useMemo(() => new MotionCycle(), [])
  const uniforms = useMemo(() => createMotionUniforms(), [])
  useRequireWebGL('NationalNetworkScene motion interpolation')
  const lerp = useMemo(() => createMotionLerp(uniforms), [uniforms])
  const viewBounds = useMemo(() => createGroundBounds(), [])
  const expandedView = useMemo(() => createGroundBounds(), [])
  const cullReference = useMemo(() => createGroundBounds(), [])
  const scratch = useMemo(() => new Float32Array(12), [])
  const frame = useRef({
    geometry: undefined as object | undefined,
    style: undefined as object | undefined,
    visibility: -1,
    previousTime: NaN,
    lastSeekAt: -Infinity,
    scrubbing: false,
    converge: true,
    cursor: 0,
    viewGeneration: 1,
    culling: false,
    active: 0,
  })
  const selectedStationTrainIds = useMemo(
    () => new Set(selectedStation?.trainIds ?? []),
    [selectedStation],
  )
  const selectedRouteTrainIds = useMemo(
    () => new Set(selectedRoute?.trainIds ?? []),
    [selectedRoute],
  )
  const comparisonTrainIds = useMemo(
    () => new Set(comparisonTrains?.map((train) => train.id) ?? []),
    [comparisonTrains],
  )
  const lightTextures = useMemo(
    () => ({
      halo: trainLightTexture('halo'),
      orb: trainLightTexture('orb'),
      spark: trainLightTexture('spark'),
      realtime: realtimeRingTexture(),
      tram: vehicleGlyphTexture('tram'),
      bus: vehicleGlyphTexture('bus'),
    }),
    [],
  )
  const { palette, trainPalette } = useVehiclePalette(snapshot, routeColors, routeColorMix, categoryColors)
  const layout = useMemo(() => {
    const counts = [0, 0, 0]
    const kinds = new Uint8Array(trains.length)
    const slots = new Uint32Array(trains.length)
    const realtimeSlots = new Int32Array(trains.length).fill(-1)
    let realtimeCount = 0
    trains.forEach((train, index) => {
      const kind = VEHICLE_MARKER_KINDS.indexOf(vehicleMarkerKind(train.category))
      kinds[index] = kind
      slots[index] = counts[kind]
      counts[kind] += 1
      if (train.realtime?.status === 'adjusted' || train.operations) {
        realtimeSlots[index] = realtimeCount
        realtimeCount += 1
      }
    })
    return { counts, kinds, slots, realtimeSlots, realtimeCount }
  }, [trains])
  const flags = useMemo(() => ({
    // 255 forces the first style sweep to classify every journey.
    eligible: new Uint8Array(trains.length).fill(255),
    included: new Uint8Array(trains.length).fill(255),
    focused: new Uint8Array(trains.length).fill(255),
    intensity: new Float32Array(trains.length),
    markerShown: new Uint8Array(trains.length),
    trailShown: new Uint8Array(trains.length * VEHICLE_TRAIL_SEGMENTS),
    trailPending: new Uint8Array(trains.length),
  }), [trains])
  const markerBuffers = useMemo(
    () => VEHICLE_MARKER_KINDS.map((_, kind) => motionBuffers(layout.counts[kind], true)),
    [layout],
  )
  const realtimeBuffers = useMemo(() => motionBuffers(layout.realtimeCount, false), [layout])
  const trailBuffers = useMemo(
    () => Array.from({ length: VEHICLE_TRAIL_SEGMENTS }, () => motionBuffers(trains.length * 2, true)),
    [trains],
  )
  const networkBounds = useMemo(() => {
    const bounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
    for (const stop of projectedStops) {
      if (stop[0] < bounds.minX) bounds.minX = stop[0]
      if (stop[0] > bounds.maxX) bounds.maxX = stop[0]
      if (stop[2] < bounds.minZ) bounds.minZ = stop[2]
      if (stop[2] > bounds.maxZ) bounds.maxZ = stop[2]
    }
    return bounds
  }, [projectedStops])

  useEffect(() => {
    localTime.current = time
  }, [time])

  useEffect(
    () => () => {
      Object.values(lightTextures).forEach((texture) => texture.dispose())
    },
    [lightTextures],
  )

  useEffect(
    () => () => {
      markerBuffers.forEach((buffers) => buffers.geometry.dispose())
      realtimeBuffers.geometry.dispose()
    },
    [markerBuffers, realtimeBuffers],
  )
  useEffect(
    () => () => {
      trailBuffers.forEach((buffers) => buffers.geometry.dispose())
    },
    [trailBuffers],
  )

  // Geometry inputs invalidate every sample; style inputs recolour and reclassify.
  /* oxlint-disable react-hooks/exhaustive-deps */
  const geometryInputs = useMemo(() => ({}), [resolveTrainPosition, snapshot, projectedStops, projectedPaths,
    lakeAvoidingPaths, motion, markerBuffers, trailBuffers, flags])
  const styleInputs = useMemo(() => ({}), [geometryInputs, selectedTrain, comparisonTrains, selectedRoute,
    selectedCategory, airCategorySelected, selectedStation, cameraFraming, trainPalette, palette])
  /* oxlint-enable react-hooks/exhaustive-deps */

  const setMotion = (index: number, state: MotionState, validFrom: number, validTo: number) => {
    const previous = motion.state[index]
    if (previous === MOTION_MOVING || previous === MOTION_CULLED) frame.current.active -= 1
    if (state === MOTION_MOVING || state === MOTION_CULLED) frame.current.active += 1
    motion.set(index, state, validFrom, validTo)
  }

  /** Marker chord is read from scratch[0..2] (from) and scratch[3..5] (to). */
  const setMarker = (index: number, show: boolean, start = 0, end = 0) => {
    const buffers = markerBuffers[layout.kinds[index]]
    const slot = layout.slots[index]
    const realtimeSlot = layout.realtimeSlots[index]
    const wasShown = flags.markerShown[index] === 1
    if (show) {
      writeMotionVertex(buffers, slot, scratch, 0, 3, start, end)
      if (realtimeSlot >= 0) writeMotionVertex(realtimeBuffers, realtimeSlot, scratch, 0, 3, start, end)
    } else if (wasShown) {
      hideMotionVertex(buffers, slot)
      if (realtimeSlot >= 0) hideMotionVertex(realtimeBuffers, realtimeSlot)
    }
    if (show === wasShown) return
    const change = show ? 1 : -1
    buffers.shown += change
    if (realtimeSlot >= 0) realtimeBuffers.shown += change
    flags.markerShown[index] = show ? 1 : 0
    setScenePickTrain(buffers.geometry, slot, show && flags.intensity[index] >= 0.1 ? trains[index] : undefined)
  }

  const hideTrail = (index: number, fromSegment: number) => {
    for (let segment = fromSegment; segment < VEHICLE_TRAIL_SEGMENTS; segment += 1) {
      const flag = index * VEHICLE_TRAIL_SEGMENTS + segment
      if (flags.trailShown[flag] !== 1) continue
      const buffers = trailBuffers[segment]
      hideMotionVertex(buffers, index * 2)
      hideMotionVertex(buffers, index * 2 + 1)
      buffers.shown -= 1
      flags.trailShown[flag] = 0
    }
  }

  /** Segment vertices are read from scratch[0..5] (older end) and scratch[6..11] (newer bracket). */
  const showTrailSegment = (index: number, segment: number, headStart: number, headEnd: number,
    tailStart: number, tailEnd: number) => {
    const buffers = trailBuffers[segment]
    writeMotionVertex(buffers, index * 2, scratch, 0, 3, headStart, headEnd)
    writeMotionVertex(buffers, index * 2 + 1, scratch, 6, 9, tailStart, tailEnd)
    const flag = index * VEHICLE_TRAIL_SEGMENTS + segment
    if (flags.trailShown[flag] === 1) return
    buffers.shown += 1
    flags.trailShown[flag] = 1
  }

  const sweepStyle = (visibleBus: boolean, visibleTram: boolean) => {
    for (let index = 0; index < trains.length; index += 1) {
      const train = trains[index]
      const focused = selectedTrain?.id === train.id ||
        comparisonTrainIds.has(train.id) ||
        Boolean(selectedRoute && selectedRouteTrainIds.has(train.id)) ||
        Boolean(selectedStation && selectedStationTrainIds.has(train.id)) ||
        selectedCategory === train.category
      const eligible = focused || (train.category === 'bus' ? visibleBus : train.category === 'tram' ? visibleTram : true)
      const stationIncludesTrain = !selectedStation || selectedStationTrainIds.has(train.id)
      const categoryIncludesTrain = !selectedCategory || selectedCategory === train.category
      const routeIncludesTrain = !selectedRoute || selectedRouteTrainIds.has(train.id)
      const included = !airCategorySelected && (
        comparisonTrains?.length
          ? comparisonTrainIds.has(train.id)
          : selectedTrain
            ? selectedTrain.id === train.id
            : stationIncludesTrain && categoryIncludesTrain && routeIncludesTrain
      )
      const intensity = included ? 1 : 0.025
      const color = trainPalette.get(train.id) ?? palette[train.category] ?? palette.other
      const buffers = markerBuffers[layout.kinds[index]]
      const slot = layout.slots[index]
      buffers.color![slot * 3] = color.r * intensity
      buffers.color![slot * 3 + 1] = color.g * intensity
      buffers.color![slot * 3 + 2] = color.b * intensity
      for (let segment = 0; segment < VEHICLE_TRAIL_SEGMENTS; segment += 1) {
        const colors = trailBuffers[segment].color!
        const offset = index * 6
        colors[offset] = colors[offset + 3] = color.r
        colors[offset + 1] = colors[offset + 4] = color.g
        colors[offset + 2] = colors[offset + 5] = color.b
      }
      const previousIntensity = flags.intensity[index]
      flags.intensity[index] = intensity
      if (flags.markerShown[index] === 1 && (previousIntensity >= 0.1) !== (intensity >= 0.1)) {
        setScenePickTrain(buffers.geometry, slot, intensity >= 0.1 ? train : undefined)
      }
      const eligibleFlag = eligible ? 1 : 0
      const includedFlag = included ? 1 : 0
      const focusedFlag = focused ? 1 : 0
      if (flags.eligible[index] === eligibleFlag && flags.included[index] === includedFlag &&
        flags.focused[index] === focusedFlag) continue
      flags.eligible[index] = eligibleFlag
      flags.included[index] = includedFlag
      flags.focused[index] = focusedFlag
      if (!eligible) setMarker(index, false)
      if (!eligible || !included) hideTrail(index, 0)
      setMotion(index, MOTION_STALE, -Infinity, Infinity)
    }
    markerBuffers.forEach((buffers) => markMotionDirty(buffers, 0, buffers.vertices - 1))
    trailBuffers.forEach((buffers) => markMotionDirty(buffers, 0, buffers.vertices - 1))
  }

  let historyTrain: NetworkTrain | undefined
  const historySampler = (sampleTime: number) => historyTrain
    ? resolveTrainPosition(historyTrain, Math.min(sampleTime, historyTrain.end), projectedStops, projectedPaths, lakeAvoidingPaths)
    : undefined

  const refresh = (index: number, context: MotionRefresh) => {
    const { now, lookahead, gridEnd, includeTrails, cull, maxHistory, viewGeneration } = context
    const train = trains[index]
    const hideAll = () => {
      setMarker(index, false)
      hideTrail(index, 0)
      flags.trailPending[index] = 0
    }
    if (flags.eligible[index] !== 1 || train.realtime?.status === 'cancelled') {
      hideAll()
      setMotion(index, MOTION_HIDDEN, -Infinity, Infinity)
      return
    }
    if (now < train.start) {
      hideAll()
      setMotion(index, MOTION_HIDDEN, -Infinity, train.start - 1e-3)
      return
    }
    if (cull && flags.focused[index] !== 1) {
      const scheduled = positionForTrain(train, Math.min(now, train.end))
      const from = scheduled && projectedStops[scheduled.fromStop]
      const to = scheduled && projectedStops[scheduled.toStop]
      if (from && to && !segmentTouchesBounds(from[0], from[2], to[0], to[2], cull)) {
        hideAll()
        setMotion(index, MOTION_CULLED, now - lookahead, now + lookahead)
        motion.viewStamps[index] = viewGeneration
        return
      }
    }

    const base = index * 3
    const trailUntil = train.end + VEHICLE_TRAIL_HISTORY_SPAN
    let headStart: number
    let headEnd: number
    if (now > train.end) {
      // Arrival labels and collapsing trails stay at the terminal.
      if (motion.state[index] !== MOTION_TERMINAL) {
        const point = resolveTrainPosition(train, train.end, projectedStops, projectedPaths, lakeAvoidingPaths)
        if (!point) {
          hideAll()
          setMotion(index, MOTION_HIDDEN, train.end, Infinity)
          return
        }
        for (let component = 0; component < 3; component += 1) motion.from[base + component] = point[component]
      }
      setMarker(index, false)
      for (let component = 0; component < 3; component += 1) {
        scratch[component] = scratch[3 + component] = motion.from[base + component]
      }
      motion.windows[index * 2] = motion.windows[index * 2 + 1] = train.end
      setMotion(index, MOTION_TERMINAL, train.end, Infinity)
      if (now > trailUntil) {
        hideTrail(index, 0)
        flags.trailPending[index] = 0
        return
      }
      headStart = train.end
      headEnd = trailUntil
    } else {
      const start = motion.windows[index * 2]
      const end = motion.windows[index * 2 + 1]
      let hasFrom = false
      if (isPlaying && motion.state[index] === MOTION_MOVING && now >= start && now <= end + lookahead * 0.5) {
        // Continue from the drawn position; the new chord still ends exactly on the route.
        const mix = end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 0
        for (let component = 0; component < 3; component += 1) {
          const from = motion.from[base + component]
          scratch[component] = from + (motion.to[base + component] - from) * mix
        }
        hasFrom = true
      } else {
        const point = resolveTrainPosition(train, now, projectedStops, projectedPaths, lakeAvoidingPaths)
        if (point) {
          scratch[0] = point[0]; scratch[1] = point[1]; scratch[2] = point[2]
          hasFrom = true
        }
      }
      const chordEnd = isPlaying ? Math.min(now + lookahead, train.end) : now
      let hasTo = false
      if (chordEnd > now) {
        const point = resolveTrainPosition(train, chordEnd, projectedStops, projectedPaths, lakeAvoidingPaths)
        if (point) {
          scratch[3] = point[0]; scratch[4] = point[1]; scratch[5] = point[2]
          hasTo = true
        }
      }
      if (!hasFrom && !hasTo) {
        hideAll()
        setMotion(index, MOTION_HIDDEN, now - lookahead, now + lookahead)
        return
      }
      if (!hasTo) { scratch[3] = scratch[0]; scratch[4] = scratch[1]; scratch[5] = scratch[2] }
      else if (!hasFrom) { scratch[0] = scratch[3]; scratch[1] = scratch[4]; scratch[2] = scratch[5] }
      for (let component = 0; component < 3; component += 1) {
        motion.from[base + component] = scratch[component]
        motion.to[base + component] = scratch[3 + component]
      }
      motion.windows[index * 2] = now
      motion.windows[index * 2 + 1] = chordEnd
      setMarker(index, true, now, chordEnd)
      const refreshAt = isPlaying ? now + (chordEnd - now) * MOTION_REFRESH_FRACTION : now
      setMotion(index, MOTION_MOVING, now, refreshAt)
      headStart = now
      headEnd = chordEnd
    }

    if (flags.included[index] !== 1 || gridEnd - VEHICLE_TRAIL_HISTORY_SPAN > train.end) {
      hideTrail(index, 0)
      flags.trailPending[index] = 0
      return
    }
    if (!includeTrails) {
      hideTrail(index, 0)
      flags.trailPending[index] = 1
      return
    }
    flags.trailPending[index] = 0
    historyTrain = train
    motion.history.fill(index, gridEnd, historySampler, maxHistory)
    let drawn = 0
    let segmentStart = headStart
    let segmentEnd = headEnd
    for (let segment = 0; segment < VEHICLE_TRAIL_SEGMENTS; segment += 1) {
      const gridTime = gridEnd - (segment + 1) * VEHICLE_TRAIL_STEP_SECONDS
      if (!motion.history.read(index, gridTime, scratch, 6)) break
      if (!motion.history.read(index, gridTime + VEHICLE_TRAIL_HISTORY_STEP_SECONDS, scratch, 9)) break
      // Every history vertex moves across the grid step now in progress.
      showTrailSegment(index, segment, segmentStart, segmentEnd, gridEnd, gridEnd + VEHICLE_TRAIL_HISTORY_STEP_SECONDS)
      for (let component = 0; component < 6; component += 1) scratch[component] = scratch[6 + component]
      segmentStart = gridEnd
      segmentEnd = gridEnd + VEHICLE_TRAIL_HISTORY_STEP_SECONDS
      drawn = segment + 1
    }
    hideTrail(index, drawn)
    if (isPlaying) {
      // Crossing the next grid time moves every bracket forward.
      motion.validTo[index] = Math.min(motion.validTo[index], gridEnd + VEHICLE_TRAIL_HISTORY_STEP_SECONDS)
    }
  }

  useFrame((state, delta) => {
    const current = frame.current
    let seek = !Number.isFinite(current.previousTime)
    if (isPlaying) {
      localTime.current += delta * playbackRate
      if (localTime.current > snapshot.metadata.windowEnd) {
        localTime.current = snapshot.metadata.windowStart
        seek = true
      }
    }
    const now = localTime.current
    const clock = frameElapsed(state)
    if (!seek) {
      const expected = current.previousTime + (isPlaying ? delta * playbackRate : 0)
      seek = isPlaying
        ? Math.abs(now - expected) > Math.max(1, playbackRate * 0.25)
        : now !== current.previousTime
    }
    current.previousTime = now

    if (current.geometry !== geometryInputs) {
      current.geometry = geometryInputs
      motion.invalidate()
      current.active = 0
      for (const buffers of trailBuffers) {
        for (let vertex = 0; vertex < buffers.vertices; vertex += 1) {
          buffers.times[vertex * 2] = 1
          buffers.times[vertex * 2 + 1] = 0
        }
        buffers.shown = 0
        markMotionDirty(buffers, 0, buffers.vertices - 1)
      }
      flags.trailShown.fill(0)
      flags.trailPending.fill(0)
      seek = true
    }
    if (seek) {
      // A lone seek refills trails at once; a run of seeks waits for the clock to settle.
      current.scrubbing = clock - current.lastSeekAt < TRAIL_SETTLE_SECONDS
      current.lastSeekAt = clock
      current.converge = true
    }

    const visibleBus = vehicleIsVisibleAtZoom('bus', state.camera.position.y, cameraFraming)
    const visibleTram = vehicleIsVisibleAtZoom('tram', state.camera.position.y, cameraFraming)
    const visibility = Number(visibleBus) + 2 * Number(visibleTram)
    if (current.style !== styleInputs || current.visibility !== visibility) {
      current.style = styleInputs
      current.visibility = visibility
      sweepStyle(visibleBus, visibleTram)
      current.converge = true
    }

    // Culling only helps when part of the network is outside the expanded view.
    let cull: GroundBounds | undefined
    if (groundViewBounds(state.camera, vehicleElevation, viewBounds)) {
      expandBounds(viewBounds, VEHICLE_CULL_MARGIN, expandedView)
      if (!boundsContain(expandedView, networkBounds)) cull = cullReference
    }
    if (Boolean(cull) !== current.culling || (cull && !boundsContain(cullReference, viewBounds))) {
      current.viewGeneration += 1
      current.culling = Boolean(cull)
      if (cull) Object.assign(cullReference, expandedView)
    }

    const includeTrails = !current.scrubbing || clock - current.lastSeekAt >= TRAIL_SETTLE_SECONDS
    const stale = motionStaleSeconds(isPlaying, playbackRate)
    const behind = isPlaying && cycle.seconds * playbackRate > stale * 0.6
    const measured = frameBudget.update(delta, behind)
    const transitioning = layoutTransitioning || (spatialLayoutMix > 0 && spatialLayoutMix < 1)
    const budget = transitioning ? Infinity : current.converge ? Math.max(measured, CONVERGE_BUDGET_MS) : measured
    const context: MotionRefresh = {
      now,
      lookahead: motionLookahead(isPlaying, playbackRate, cycle.seconds),
      gridEnd: trailGridStart(now),
      includeTrails,
      cull,
      maxHistory: frameBudget.reduced ? REDUCED_TRAIL_HISTORY_SAMPLES : VEHICLE_TRAIL_HISTORY_LENGTH,
      viewGeneration: current.viewGeneration,
    }

    const count = trains.length
    const started = performance.now()
    let index = count ? current.cursor % count : 0
    let refreshed = 0
    let exhausted = false
    for (let scanned = 0; scanned < count; scanned += 1) {
      if (motion.due(index, now, isPlaying, context.viewGeneration) ||
        (includeTrails && flags.trailPending[index] === 1)) {
        refresh(index, context)
        refreshed += 1
        if (refreshed % MOTION_BUDGET_CHECK === 0 && performance.now() - started > budget) {
          exhausted = true
          index = index + 1 === count ? 0 : index + 1
          break
        }
      }
      index = index + 1 === count ? 0 : index + 1
    }
    current.cursor = index
    if (!exhausted) current.converge = false
    cycle.record(refreshed, delta, exhausted, current.active)

    markerBuffers.forEach((buffers) => {
      flushMotionBuffers(buffers)
      setSceneMotionClock(buffers.geometry, now, stale)
    })
    flushMotionBuffers(realtimeBuffers)
    setSceneMotionClock(realtimeBuffers.geometry, now, stale)
    trailBuffers.forEach(flushMotionBuffers)
    uniforms.clock.value = now
    uniforms.stale.value = stale

    // A paused scene follows the consumer's clock, including in linked views.
    if (isPlaying && clock - lastReport.current > (selectedTrain || comparisonTrains?.length ? 0.1 : uiFrameBudget.interval(delta) * 3)) {
      lastReport.current = clock
      onTime(now)
    }
  })

  const trailOpacity = [0.4, 0.22, 0.1]
  return (
    <>
      <group position={[0, mapStyle.trailElevationOffset ?? (mapStyle.coplanar ? 0 : -0.035), 0]}>
        {trailBuffers.map((buffers, index) => (
          <lineSegments
            key={index}
            geometry={buffers.geometry}
            frustumCulled={false}
            renderOrder={flat ? 5 : 3 + index}
          >
            <lineBasicMaterial
              {...lerp}
              vertexColors
              transparent
              opacity={trailOpacity[index]}
              blending={THREE.AdditiveBlending}
              depthTest={!flat}
              depthWrite={false}
              toneMapped={false}
            />
          </lineSegments>
        ))}
      </group>
      {VEHICLE_MARKER_KINDS.map((kind, kindIndex) => {
        const geometry = markerBuffers[kindIndex].geometry
        const isCityVehicle = kind === 'tram' || kind === 'bus'
        const glyphTexture =
          kind === 'tram'
            ? lightTextures.tram
            : kind === 'bus'
              ? lightTextures.bus
              : lightTextures.orb
        return (
          <group key={kind}>
            <points
              geometry={geometry}
              frustumCulled={false}
              renderOrder={MAP_LAYER.vehicleGlow}
            >
              <pointsMaterial
                {...lerp}
                vertexColors
                map={lightTextures.halo}
                size={isCityVehicle ? 7.5 : 9}
                transparent
                opacity={
                  selectedTrain ||
                  selectedRoute ||
                  selectedCategory ||
                  selectedStation ||
                  airCategorySelected
                    ? 0.055
                    : isCityVehicle
                      ? 0.11
                      : 0.15
                }
                alphaTest={0.005}
                depthTest={false}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                sizeAttenuation={false}
                toneMapped={false}
              />
            </points>
            <points
              geometry={geometry}
              frustumCulled={false}
              renderOrder={MAP_LAYER.vehicleCore}
            >
              <pointsMaterial
                {...lerp}
                vertexColors
                map={glyphTexture}
                size={kind === 'rail' ? 4.6 : 6.2}
                transparent
                opacity={isCityVehicle ? 0.95 : 0.9}
                alphaTest={0.035}
                depthTest={false}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                sizeAttenuation={false}
                toneMapped={false}
              />
            </points>
            {kind === 'rail' && (
              <points
                geometry={geometry}
                frustumCulled={false}
                renderOrder={MAP_LAYER.vehicleSpark}
              >
                <pointsMaterial
                  {...lerp}
                  vertexColors
                  map={lightTextures.spark}
                  size={1.8}
                  transparent
                  opacity={1}
                  alphaTest={0.025}
                  depthTest={false}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  sizeAttenuation={false}
                  toneMapped={false}
                />
              </points>
            )}
          </group>
        )
      })}
      <points
        geometry={realtimeBuffers.geometry}
        frustumCulled={false}
        renderOrder={MAP_LAYER.focusMarkerGlow}
      >
        <pointsMaterial
          {...lerp}
          color="#8dfaff"
          map={lightTextures.realtime}
          size={10}
          transparent
          opacity={0.9}
          alphaTest={0.02}
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation={false}
          toneMapped={false}
        />
      </points>
    </>
  )
}

function NetworkCamera({
  selectedTrain,
  time,
  isPlaying,
  playbackRate,
  projectedStops,
  projectedPaths,
  cameraCommand,
  selectedStation,
  cameraFraming,
  mapFocus,
  selectedAirTrack,
  airProjection,
  spatialLayoutMix = 0,
}: {
  readonly selectedTrain?: NetworkTrain
  readonly time: number
  readonly isPlaying: boolean
  readonly playbackRate: number
  readonly projectedStops: readonly ProjectedStop[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly cameraCommand?: MapCameraCommand
  readonly selectedStation?: StationIndexEntry
  readonly cameraFraming: MapCameraFraming
  readonly mapFocus: THREE.Vector3
  readonly selectedAirTrack?: AirTrack
  readonly airProjection: NetworkProjection
  readonly spatialLayoutMix?: number
}) {
  const state = useThree(), renderer = frameRenderer(state)
  const { camera, size } = state
  const lakeAvoidingPaths = useContext(LakeAvoidingPathsContext)
  const resolveTrainPosition = useProjectedTrainPosition()
  const [desiredPosition, desiredTarget, currentTarget] = useMemo(() =>
    [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], [])
  const mapTarget = useRef(new THREE.Vector3())
  const { cameraViewport, createCameraDriver } = useNetworkScene().props.extensions ?? {}
  const viewportFraming = useMemo(() => createCameraViewportFraming(camera as THREE.PerspectiveCamera), [camera])
  const cameraDriver = useRef<NetworkCameraDriver | undefined>(undefined)
  useEffect(() => {
    const driver = createCameraDriver && camera instanceof THREE.PerspectiveCamera
      ? createCameraDriver({ camera, target: currentTarget, projection: airProjection }) : undefined
    cameraDriver.current = driver
    return () => {
      cameraDriver.current = undefined
      driver?.dispose()
      viewportFraming()
    }
  }, [createCameraDriver, camera, currentTarget, airProjection, viewportFraming, cameraViewport])
  const distanceScale = useRef(1)
  const localTime = useRef(time)
  const directTouch = useRef(false)
  const lastCommand = useRef(0)
  const viewportAspect = size.height > 0 ? size.width / size.height : 1
  const minimumDistanceScale = minimumMapDistanceScale(
    cameraFraming,
    viewportAspect,
  )

  useEffect(() => {
    localTime.current = time
  }, [time])

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || size.height <= 0) return
    const fieldOfView = mapCameraFieldOfView(viewportAspect)
    const focalLength =
      (0.5 * camera.getFilmHeight()) /
      Math.tan(THREE.MathUtils.degToRad(fieldOfView * 0.5))
    camera.setFocalLength(focalLength)
  }, [camera, size.height, viewportAspect])

  useEffect(() => {
    distanceScale.current = Math.max(
      minimumDistanceScale,
      distanceScale.current,
    )
  }, [minimumDistanceScale])

  useEffect(() => {
    mapTarget.current.copy(mapFocus)
    distanceScale.current = homeMapDistanceScale(cameraFraming)
  }, [cameraFraming, mapFocus])

  useEffect(() => {
    if (!cameraCommand || cameraCommand.id === lastCommand.current) return
    lastCommand.current = cameraCommand.id
    if (cameraCommand.action === 'reset') {
      mapTarget.current.copy(mapFocus)
      distanceScale.current = homeMapDistanceScale(cameraFraming)
    } else if (cameraCommand.action === 'reveal-station') {
      if (selectedStation) {
        const centre = stationCentre(selectedStation, projectedStops)
        camera.updateMatrixWorld()
        if (cameraCommand.distanceScale !== undefined || mapSelectionNeedsReveal(centre.clone().project(camera))) mapTarget.current.copy(centre)
        if (cameraCommand.distanceScale !== undefined) distanceScale.current = Math.max(minimumDistanceScale, cameraCommand.distanceScale)
      }
    } else if (cameraCommand.action === 'focus-road' || cameraCommand.action === 'focus-location') {
      if (cameraCommand.focus) {
        const [x, , z] = projectCoordinate(cameraCommand.focus, airProjection)
        mapTarget.current.set(x, 0, z)
        distanceScale.current = Math.max(minimumDistanceScale, cameraCommand.distanceScale ?? 0.58)
      }
    } else {
      const multiplier = cameraCommand.action === 'zoom-in' ? 0.78 : 1.28
      distanceScale.current = applyMapZoom(distanceScale.current, multiplier, minimumDistanceScale)
    }
    cameraDriver.current?.onCommand?.(cameraCommand, selectedStation, mapTarget.current)
  }, [
    camera,
    cameraCommand,
    cameraFraming,
    airProjection,
    mapFocus,
    minimumDistanceScale,
    projectedStops,
    selectedStation,
  ])

  useEffect(() => {
    const element = renderer.domElement
    const pointers = new Map<
      number,
      { x: number; y: number; pointerType: string }
    >()
    let pinchDistance: number | undefined

    const onPointerDown = (event: PointerEvent) => {
      cameraDriver.current?.onGesture?.()
      if (selectedTrain || selectedAirTrack || (event.pointerType === 'mouse' && event.button !== 0)) return
      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        pointerType: event.pointerType,
      })
      if (event.pointerType === 'touch') directTouch.current = true
      element.setPointerCapture(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId)
      if (!previous || selectedTrain || selectedAirTrack) return
      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        pointerType: previous.pointerType,
      })
      if (pointers.size === 1) {
        const panScale = mapPanScale(
          distanceScale.current,
          previous.pointerType,
        )
        mapTarget.current.x -= (event.clientX - previous.x) * panScale
        mapTarget.current.z -= (event.clientY - previous.y) * panScale
        mapTarget.current.x = THREE.MathUtils.clamp(mapTarget.current.x, -25, 25)
        mapTarget.current.z = THREE.MathUtils.clamp(mapTarget.current.z, -16, 16)
      } else if (pointers.size === 2) {
        const [first, second] = [...pointers.values()]
        const nextDistance = Math.hypot(first.x - second.x, first.y - second.y)
        if (pinchDistance && nextDistance > 0) {
          distanceScale.current = applyMapZoom(
            distanceScale.current,
            pinchDistance / nextDistance,
            minimumDistanceScale,
          )
        }
        pinchDistance = nextDistance
      }
      event.preventDefault()
    }
    const onPointerUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId)
      directTouch.current = [...pointers.values()].some(
        (pointer) => pointer.pointerType === 'touch',
      )
      if (pointers.size < 2) pinchDistance = undefined
    }
    const onWheel = (event: WheelEvent) => {
      cameraDriver.current?.onGesture?.()
      if (selectedTrain || selectedAirTrack) return
      distanceScale.current = applyMapZoom(
        distanceScale.current,
        mapWheelZoomMultiplier(event.deltaY, event.deltaMode),
        minimumDistanceScale,
      )
      event.preventDefault()
    }

    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('pointerup', onPointerUp)
    element.addEventListener('pointercancel', onPointerUp)
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', onPointerUp)
      element.removeEventListener('pointercancel', onPointerUp)
      element.removeEventListener('wheel', onWheel)
    }
  }, [renderer, minimumDistanceScale, selectedAirTrack, selectedTrain])

  useCameraFrame((_, delta) => {
    if (cameraDriver.current?.update(delta)) return
    if (isPlaying) {
      localTime.current += delta * playbackRate
    }
    const trainPosition = selectedTrain
      ? resolveTrainPosition(
          selectedTrain,
          localTime.current,
          projectedStops,
          projectedPaths,
          lakeAvoidingPaths,
        )
      : undefined
    const airState = selectedAirTrack
      ? positionForAirTrack(selectedAirTrack, localTime.current)
      : undefined
    const airPosition = airState
      ? projectAirPosition(airState, airProjection)
      : undefined
    const diagramMix = THREE.MathUtils.clamp(spatialLayoutMix, 0, 1)
    const following = Boolean(trainPosition || airPosition)
    const interpolation = cameraDriver.current?.prepareFrame?.(mapTarget.current, projectedStops, diagramMix, delta, following)
    if (trainPosition) {
      desiredTarget.set(trainPosition[0], 0, trainPosition[2])
      desiredPosition.set(
        trainPosition[0] + THREE.MathUtils.lerp(4.2, 0.6, diagramMix),
        THREE.MathUtils.lerp(4.8, 12, diagramMix),
        trainPosition[2] + THREE.MathUtils.lerp(6.5, 0.8, diagramMix),
      )
    } else if (airPosition && airState) {
      const heading = THREE.MathUtils.degToRad(airState.headingDegrees)
      const forwardX = Math.sin(heading)
      const forwardZ = -Math.cos(heading)
      desiredTarget.set(...airPosition)
      desiredPosition.set(
        airPosition[0] - forwardX * 5.5 + 2.4,
        airPosition[1] + 4.2,
        airPosition[2] - forwardZ * 5.5 + 2.4,
      )
    } else {
      desiredTarget.copy(mapTarget.current)
      desiredPosition.set(
        mapTarget.current.x,
        THREE.MathUtils.lerp(37, 43, diagramMix) * distanceScale.current,
        mapTarget.current.z +
          THREE.MathUtils.lerp(26, 1.2, diagramMix) * distanceScale.current,
      )
    }

    const damping = interpolation ??
      1 - Math.exp(-delta * mapCameraDampingRate(following, directTouch.current))
    camera.position.lerp(desiredPosition, damping)
    currentTarget.lerp(desiredTarget, damping)
    viewportFraming(cameraViewport?.({ ...size, spatialLayoutMix: diagramMix }), size)
    camera.lookAt(currentTarget)
    camera.updateMatrixWorld()
  })

  return null
}

function UserLocationMarker({ location, projection }: {
  location: NonNullable<NationalNetworkSceneProps['userLocation']>
  projection: NetworkProjection
}) {
  const texture = useMemo(() => createGlowPointTexture(), [])
  useEffect(() => () => texture.dispose(), [texture])
  return <group position={projectCoordinate([location.longitude, location.latitude], projection, 0.15)}>
    <sprite scale={[0.055, 0.055, 1]} renderOrder={30}>
      <spriteMaterial map={texture} color="#70caff" transparent opacity={0.65} sizeAttenuation={false} depthTest={false} depthWrite={false} />
    </sprite>
    <sprite scale={[0.015, 0.015, 1]} renderOrder={31}>
      <spriteMaterial map={texture} color="#eaf8ff" transparent sizeAttenuation={false} depthTest={false} depthWrite={false} />
    </sprite>
  </group>
}

function NetworkWorld(props: NationalNetworkSceneProps) {
  const RoadLayer = props.extensions?.RoadLayer ?? DefaultRoadLayer
  const projection = useMemo(
    () => createNetworkProjection(props.referenceSnapshot),
    [props.referenceSnapshot],
  )
  const geographicStops = useMemo(
    () => projectStops(props.snapshot, projection),
    [projection, props.snapshot],
  )
  const geographicPaths = useMemo(
    () => projectPaths(props.snapshot, projection),
    [projection, props.snapshot],
  )
  const morph = props.extensions?.spatialMorph
  const alternateLayout = useMemo(
    () =>
      morph ? projectSpatialMorph(geographicStops, geographicPaths, projection, morph) : props.spatialLayout
        ? projectSpatialLayout(
            props.snapshot,
            props.spatialLayout,
            geographicStops,
            geographicPaths,
          )
        : undefined,
    [geographicPaths, geographicStops, props.snapshot, props.spatialLayout, projection, morph],
  )
  const projectedLayout = useMemo(
    () =>
      blendProjectedSpatialLayout(
        geographicStops,
        geographicPaths,
        alternateLayout,
        props.spatialLayoutMix ?? 0,
        Boolean(morph),
      ),
    [
      alternateLayout,
      geographicPaths,
      geographicStops,
      props.spatialLayoutMix,
      morph,
    ],
  )
  const projectedStops = projectedLayout.stops
  const projectedPaths = projectedLayout.paths
  const contextProjectedStops = useMemo(
    () =>
      props.contextSnapshot
        ? projectStops(props.contextSnapshot, projection)
        : undefined,
    [projection, props.contextSnapshot],
  )
  const contextProjectedPaths = useMemo(
    () =>
      props.contextSnapshot
        ? projectPaths(props.contextSnapshot, projection)
        : undefined,
    [projection, props.contextSnapshot],
  )
  const projectedLakeRings = useMemo(
    () =>
      props.lakes?.lakes.flatMap((lake) =>
        lake.polygons.flatMap((polygon) => {
          const outerRing = polygon[0]
          return outerRing
            ? [
                outerRing.map((coordinate) =>
                  projectCoordinate(coordinate, projection),
                ),
              ]
            : []
        }),
      ) ?? [],
    [projection, props.lakes],
  )
  const needsGeographicDetours = Boolean(morph) || (props.spatialLayoutMix ?? 0) <= 0
  const geographicDetours = useMemo(() => needsGeographicDetours ? createLakeAvoidingPathMap(
    props.snapshot.edges, props.snapshot.edgePaths, geographicStops, projectedLakeRings,
  ) : EMPTY_LAKE_AVOIDING_PATHS, [props.snapshot.edges, props.snapshot.edgePaths, geographicStops, projectedLakeRings, needsGeographicDetours])
  const lakeAvoidingPaths = useMemo(
    () => {
      if ((props.spatialLayoutMix ?? 0) > 0) return EMPTY_LAKE_AVOIDING_PATHS
      return geographicDetours
    },
    [
      geographicDetours,
      props.spatialLayoutMix,
    ],
  )
  const mapFocus = useMemo(() => {
    const { bounds } = props.snapshot
    const centre: BoundaryCoordinate = [
      (bounds.minLongitude + bounds.maxLongitude) / 2,
      (bounds.minLatitude + bounds.maxLatitude) / 2,
    ]
    const [x, , z] = projectCoordinate(centre, projection)
    return new THREE.Vector3(x, 0, z)
  }, [projection, props.snapshot])
  const hasContext = Boolean(props.contextSnapshot && contextProjectedStops)
  const motion = useMemo(
    () => new VehicleMotionTable(props.snapshot.trains),
    [props.snapshot],
  )
  const trainTimeIndex = useMemo(
    () =>
      buildTrainTimeIndex(
        props.snapshot.trains,
        props.snapshot.metadata.windowStart,
        props.snapshot.metadata.windowEnd,
        VEHICLE_TRAIL_SEGMENTS * VEHICLE_TRAIL_STEP_SECONDS,
      ),
    [props.snapshot],
  )
  const routeColorMix =
    props.routeColorMix ?? props.spatialLayoutMix ?? 0
  const selectedTrainRouteColor = props.selectedTrain
    ? mixedRouteColor(
        props.selectedTrain.category,
        props.selectedTrain.route,
        props.routeColors,
        routeColorMix,
        props.mapStyle?.categoryColors,
      )
    : undefined
  const selectedLineRouteColor = props.selectedRoute
    ? mixedRouteColor(
        props.selectedRoute.category,
        props.selectedRoute.name,
        props.routeColors,
        routeColorMix,
        props.mapStyle?.categoryColors,
      )
    : undefined
  const comparisonTrainIds = new Set(
    props.comparisonTrains?.map((train) => train.id) ?? [],
  )
  const hasComparison = comparisonTrainIds.size > 0
  const comparisonColors = props.comparisonTrains?.map((train, index) =>
    props.comparisonColors?.[index] ??
    mixedRouteColor(
      train.category,
      train.route,
      props.routeColors,
      routeColorMix,
      props.mapStyle?.categoryColors,
    ),
  )

  return (
    <NetworkSceneProviderContext.Provider value={{ props, projection, projectedStops, projectedPaths, lakeAvoidingPaths }}>
    <LakeAvoidingPathsContext.Provider value={lakeAvoidingPaths}>
      <fog attach="fog" args={['#050410', 34, 69]} />
      <ambientLight intensity={0.85} color="#7d87ff" />
      <NationalGround quiet={props.groundStyle === 'quiet'} />
      {props.userLocation && (props.spatialLayoutMix ?? 0) === 0 &&
        Number.isFinite(props.userLocation.longitude) && Number.isFinite(props.userLocation.latitude) &&
        <UserLocationMarker location={props.userLocation} projection={projection} />}
      {props.lakes && (
        <LakeLayer
          lakes={props.lakes}
          projection={projection}
          opacityScale={props.mapStyle?.materials?.waterOpacityScale?.(props.spatialLayoutMix ?? 0) ?? 1 - (props.spatialLayoutMix ?? 0)}
          subdued={Boolean(
            props.selectedTrain ||
              hasComparison ||
              props.selectedRoute ||
              props.selectedStation ||
              props.selectedCategory ||
              props.airCategorySelected ||
              props.roadCategorySelected ||
              props.selectedRoadId
          )}
        />
      )}
      {projectedLayout.context?.waterPaths && (
        <DiagramWaterLayer
          paths={projectedLayout.context.waterPaths}
          opacity={props.spatialLayoutMix ?? 0}
        />
      )}
      {props.boundary && (
        <CountryBorder
          boundary={props.boundary}
          projection={projection}
          opacityScale={1 - (props.spatialLayoutMix ?? 0)}
          subdued={Boolean(
            props.selectedTrain ||
              hasComparison ||
              props.selectedRoute ||
              props.selectedStation ||
              props.selectedCategory ||
              props.airCategorySelected ||
              props.roadCategorySelected ||
              props.selectedRoadId ||
              hasContext
          )}
        />
      )}
      {props.referencePaths && (
        <ReferencePathLayer
          references={props.referencePaths}
          projection={projection}
          subdued={Boolean(
            props.selectedTrain ||
              hasComparison ||
              props.selectedRoute ||
              props.selectedStation ||
              props.selectedCategory
          )}
        />
      )}
      {props.contextSnapshot && contextProjectedStops && contextProjectedPaths && (
        <RailGraph
          snapshot={props.contextSnapshot}
          pickable={false}
          projectedStops={contextProjectedStops}
          projectedPaths={contextProjectedPaths}
          cameraFraming={ATLAS_MAP_FRAMING}
          subdued
          lakeAvoidingPaths={EMPTY_LAKE_AVOIDING_PATHS}
          showTraffic={false}
        />
      )}
      <RailGraph
        morph={Boolean(morph)}
        snapshot={props.snapshot}
        infrastructureSnapshot={props.infrastructureSnapshot}
        projectedStops={morph ? geographicStops : projectedStops}
        projectedPaths={morph ? geographicPaths : projectedPaths}
        cameraFraming={props.cameraFraming}
        lakeAvoidingPaths={morph ? geographicDetours : lakeAvoidingPaths}
        subdued={Boolean(
          props.selectedTrain ||
            hasComparison ||
            props.selectedRoute ||
            props.selectedStation ||
            props.selectedCategory ||
            props.airCategorySelected ||
            props.roadCategorySelected ||
            props.selectedRoadId
        )}
        routeColors={props.routeColors}
        routeColorMix={routeColorMix}
        trafficOverviewEmphasis={props.trafficOverviewEmphasis}
        lineMapStyle={props.topologicalStyle === 'line-map'}
      />
      {(props.roadSnapshot || props.roadTopology) && (
        <Suspense fallback={null}><RoadLayer
          style={props.mapStyle?.roads}
          surfaceY={props.mapStyle?.coplanar ? COPLANAR_MAP_SURFACE_Y : undefined}
          Overlay={props.extensions?.RoadOverlay}
          snapshot={props.roadSnapshot}
          nationalSnapshot={props.nationalRoadSnapshot}
          conditionsAtTime={props.extensions?.roadConditions}
          topology={props.roadTopology}
          time={props.time}
          isPlaying={props.isPlaying}
          playbackRate={props.playbackRate}
          projection={projection}
          selectedRoadId={props.selectedRoadId}
          subdued={Boolean(
            props.selectedTrain ||
              hasComparison ||
              props.selectedRoute ||
              props.selectedStation ||
              props.selectedCategory ||
              props.airCategorySelected
          )}
        /></Suspense>
      )}
      {props.mapStyle?.airports?.independent && <Suspense fallback={null}><group visible={props.mapStyle.airports.visible ?? true}>
        {props.airports?.map(airport => (
          <AirportMarker key={airport.id} airport={airport} projection={projection}
            showLabel={props.mapStyle?.airports?.showLabels ?? true}
            selected={airport.id === props.selectedAirport?.id} style={props.mapStyle?.airports} />
        ))}
      </group></Suspense>}
      {props.airSnapshot && (
        <Suspense fallback={null}><AirTrafficLayer
          airportStyle={props.mapStyle?.airports}
          picking={props.extensions?.aircraftPicking}
          snapshot={props.airSnapshot}
          time={props.time}
          isPlaying={props.isPlaying}
          playbackRate={props.playbackRate}
          projection={projection}
          airports={props.airports}
          emphasizeAirports={props.airCategorySelected}
          selectedTrackId={props.selectedAirTrack?.id}
          selectedAirport={props.selectedAirport}
          onSelectTrack={props.onSelectAirTrack}
          labelMode={props.trainLabelMode}
          subdued={Boolean(
            props.selectedTrain ||
              hasComparison ||
              props.selectedRoute ||
              props.selectedStation ||
              props.selectedCategory ||
              props.roadCategorySelected
          )}
        /></Suspense>
      )}
      {props.selectedTrain && (
        <>
          <SelectedRoute
            train={props.selectedTrain}
            projectedStops={projectedStops}
            projectedPaths={projectedPaths}
            color={selectedTrainRouteColor}
          />
          <SelectedTrainMarker
            train={props.selectedTrain}
            time={props.time}
            projectedStops={projectedStops}
            projectedPaths={projectedPaths}
            color={props.mapStyle?.categoryColors ? selectedTrainRouteColor : undefined}
          />
        </>
      )}
      {props.comparisonTrains?.map((train, index) => (
        <group key={`comparison:${train.id}`}>
          <SelectedRoute
            train={train}
            projectedStops={projectedStops}
            projectedPaths={projectedPaths}
            color={comparisonColors?.[index]}
            comparisonLayer={index === 0 ? 'foundation' : 'foreground'}
          />
          <SelectedTrainMarker
            train={train}
            time={props.time}
            projectedStops={projectedStops}
            projectedPaths={projectedPaths}
            color={comparisonColors?.[index]}
          />
        </group>
      ))}
      {props.selectedRoute && (
        <SelectedLinePaths
          route={props.selectedRoute}
          snapshot={props.snapshot}
          projectedStops={projectedStops}
          projectedPaths={projectedPaths}
          color={selectedLineRouteColor}
        />
      )}
      {props.selectedStation && !hasComparison && (
        <SelectedStationRoutes
          station={props.selectedStation}
          snapshot={props.snapshot}
          projectedStops={projectedStops}
          projectedPaths={projectedPaths}
          selectedCategory={props.selectedCategory}
        />
      )}
      {props.children}
      <VehicleMotion
        {...props}
        projectedStops={projectedStops}
        projectedPaths={projectedPaths}
        trainTimeIndex={trainTimeIndex}
        motion={motion}
      />
      <StationLabels
        spatialLayoutMix={props.spatialLayoutMix}
        stations={props.stations}
        snapshot={props.snapshot}
        referenceSnapshot={props.referenceSnapshot}
        projectedStops={projectedStops}
        selectedRoute={props.selectedRoute}
        selectedStation={props.selectedStation}
        selectedTrain={props.selectedTrain}
        cameraFraming={props.cameraFraming}
        layoutTransitioning={props.layoutTransitioning}
        tierLimit={props.stationLabelTierLimit}
        settleSeconds={props.stationLabelSettleSeconds}
        hidden={props.airCategorySelected}
        lineMapMix={
          props.topologicalStyle === 'line-map'
            ? props.spatialLayoutMix
            : 0
        }
      />
      {props.extensions?.stationPicking !== 'custom' && (
      <StationTapTarget
        style={props.mapStyle?.stationLabels}
        spatialLayoutMix={props.spatialLayoutMix}
        accepts={props.extensions?.acceptsStationPick}
        stations={props.stations}
        projectedStops={projectedStops}
        cameraFraming={props.cameraFraming}
        onSelectStation={
          props.airCategorySelected ? undefined : props.onSelectStation
        }
      />
      )}
      <TrainLabels
        {...props}
        projectedStops={projectedStops}
        projectedPaths={projectedPaths}
        trainTimeIndex={trainTimeIndex}
        motion={motion}
      />
      <NetworkCamera
        selectedTrain={props.selectedTrain}
        time={props.time}
        isPlaying={props.isPlaying}
        playbackRate={props.playbackRate}
        projectedStops={projectedStops}
        projectedPaths={projectedPaths}
        cameraCommand={props.cameraCommand}
        selectedStation={props.selectedStation}
        cameraFraming={props.cameraFraming}
        mapFocus={mapFocus}
        selectedAirTrack={props.selectedAirTrack}
        airProjection={projection}
        spatialLayoutMix={props.spatialLayoutMix}
      />
    </LakeAvoidingPathsContext.Provider>
    </NetworkSceneProviderContext.Provider>
  )
}

export function NationalNetworkScene(props: NationalNetworkSceneProps) {
  return (
    <Canvas
      frameloop={props.frameloop}
      camera={{ position: [0, 37, 26], fov: 44, near: 0.1, far: 120 }}
      dpr={[1, 1.65]}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#050410']} />
      <NetworkWorld {...props} />
    </Canvas>
  )
}
