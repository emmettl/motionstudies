import { mapSurfaceY } from './scene-surface.ts'
import { useMapStyle } from './scene-map-style.ts'
import { stationCentre, type ProjectedStop } from './station-picking.ts'
import { mapLabelBoxesOverlap } from '@motionstudies/core/map-labels'
import {
  stationLabelTexture,
  createTrainLabelTexture,
  type StationLabelTexture,
  type TrainLabelTexture,
} from './label-textures.ts'
import { setScenePickMetadata } from './scene-picking.ts'
import { StationLabelFrame } from './station-label-frame.ts'
import { LabelFrameBudget } from './label-frame-budget.ts'
import { useWebGLStudyFrame as useFrame, useWebGLStudyState as useThree } from './webgl-study.ts'
import { useEffect, useMemo, useRef } from 'react'
import { networkRouteColor as mixedRouteColor, trainLabelCollisionBox } from './scene-style.ts'
import { stationLabelBoxes, emptyLabelBoxes } from './map-cartography.ts'
import * as THREE from 'three'
import {
  type NetworkSnapshot,
  type NetworkRouteIndexEntry,
  type NetworkTrain,
  type StationIndexEntry,
} from '@motionstudies/core/domain/network'
import { trainsNearTime, type TrainTimeIndex } from '@motionstudies/core/domain/train-time-index'
import {
  compareStationLabelCandidates,
  stationLabelSelection,
  stationLabelPriority,
  MAX_STATION_LABELS,
  rankStationsForLabels,
  stationLabelCameraHeight,
  stationLabelBudget,
  stationLabelRankLimit,
  stationLabelScreenHeight,
  stationLabelOpacity,
  stationLabelScreenWidth,
  stationLabelText,
  stationLabelWorldHeight,
  stationLabelsCanRepopulate,
  stationLabelWithinTier,
  stableStationLabelBudget,
} from './station-labels.ts'
import {
  categoryIsVisibleInAutoMode,
  compareTrainLabelCandidates,
  MAX_TRAIN_LABELS,
  nonRailCategorySuppressesTrainLabels,
  trainLabelArrivalOpacity,
  styledTrainLabelBudget,
  trainLabelIdentity,
  styledTrainLabelScreenHeight,
  trainLabelScreenWidth,
} from './train-labels.ts'
import { VehicleMotionTable } from './vehicle-motion.ts'
import { motionStaleSeconds } from './motion-schedule.ts'
import { type MapCameraFraming } from './map-camera.ts'
import { type ProjectedNetworkPath } from './network-paths.ts'
import { regionalCameraHeight, vehicleIsVisibleAtZoom } from './regional-lod.ts'
import { MAP_LAYER, STATION_SURFACE_Y } from './scene-layer-order.ts'
import type { NationalNetworkSceneProps } from './NationalNetworkScene.tsx'

export interface StationLabelDatum {
  readonly station: StationIndexEntry
  readonly displayName: string
  readonly position: THREE.Vector3
  readonly rank: number
  readonly emphasised: boolean
}

export function StationLabels({
  stations,
  snapshot,
  referenceSnapshot,
  projectedStops,
  selectedRoute,
  selectedStation,
  selectedTrain,
  cameraFraming,
  layoutTransitioning = false,
  tierLimit,
  settleSeconds,
  hidden = false,
  lineMapMix = 0,
  spatialLayoutMix = 0,
}: {
  readonly stations: readonly StationIndexEntry[]
  readonly snapshot: NetworkSnapshot
  readonly referenceSnapshot: NetworkSnapshot
  readonly projectedStops: readonly ProjectedStop[]
  readonly selectedRoute?: NetworkRouteIndexEntry
  readonly selectedStation?: StationIndexEntry
  readonly selectedTrain?: NetworkTrain
  readonly cameraFraming: MapCameraFraming
  readonly layoutTransitioning?: boolean
  readonly tierLimit?: number
  readonly settleSeconds?: number
  readonly hidden?: boolean
  readonly lineMapMix?: number
  readonly spatialLayoutMix?: number
}) {
  const { camera, size } = useThree()
  const mapStyle = useMapStyle()
  const stationStyle = mapStyle.stationLabels
  const coplanar = mapStyle.coplanar
  const labelRefreshSeconds = useRef(0)
  const sprites = useRef<Array<THREE.Sprite | null>>([])
  const textures = useRef(new Map<string, StationLabelTexture>())
  const retainedStationNames = useRef(new Set<string>())
  const previousCameraPosition = useRef(new THREE.Vector3())
  const previousCameraQuaternion = useRef(new THREE.Quaternion())
  const cameraWasSampled = useRef(false)
  const cameraStableSeconds = useRef(Number.POSITIVE_INFINITY)
  const lineMapLabels = lineMapMix >= 0.72
  const { stationNames: routeStationNames, terminalNames } = useMemo(
    () => stationLabelSelection(snapshot, selectedRoute, selectedTrain, referenceSnapshot),
    [snapshot, referenceSnapshot, selectedRoute, selectedTrain],
  )
  const labels = useMemo(() => {
    const ranked = stationStyle?.orderStations?.(rankStationsForLabels(stations)) ?? rankStationsForLabels(stations)
    const stationByName = new Map(ranked.map((station) => [station.name, station]))
    const ordered: StationIndexEntry[] = []
    const usedNames = new Set<string>()
    const add = (station: StationIndexEntry | undefined) => {
      if (!station || usedNames.has(station.name)) return
      usedNames.add(station.name)
      ordered.push(station)
    }

    add(selectedStation)
    routeStationNames.forEach((name) => add(stationByName.get(name)))
    ranked.forEach(add)

    return ordered.map((station) => {
      const centre = stationCentre(station, projectedStops)
      return {
        station,
        displayName: stationLabelText(station.name, cameraFraming),
        position: new THREE.Vector3(centre.x, mapSurfaceY(coplanar, STATION_SURFACE_Y), centre.z),
        rank: ranked.indexOf(station),
        emphasised:
          station.name === selectedStation?.name || routeStationNames.has(station.name),
      } satisfies StationLabelDatum
    })
  }, [coplanar, cameraFraming, projectedStops, routeStationNames, selectedStation, stations, stationStyle])
  // These dependencies invalidate cached frame work when render inputs change.
  /* oxlint-disable react-hooks/exhaustive-deps */
  const stationLabelFrame = useMemo(() => new StationLabelFrame(), [stationStyle, labels, selectedTrain, selectedRoute, selectedStation, terminalNames, cameraFraming, tierLimit, settleSeconds, hidden, lineMapMix, layoutTransitioning, spatialLayoutMix])
  /* oxlint-enable react-hooks/exhaustive-deps */

  useEffect(
    () => () => {
      textures.current.forEach(({ texture }) => texture.dispose())
      textures.current.clear()
    },
    [],
  )

  useEffect(() => {
    retainedStationNames.current.clear()
  }, [
    cameraFraming,
    lineMapLabels,
    selectedRoute,
    selectedStation,
    selectedTrain,
    tierLimit,
  ])

  useFrame((_, delta) => {
    const baseHeight = stationLabelCameraHeight(
      camera.position.y,
      cameraFraming,
    )
    const semanticHeight = stationStyle?.semanticHeight?.(baseHeight, spatialLayoutMix) ?? baseHeight
    const cameraMoved = cameraWasSampled.current && (
      previousCameraPosition.current.distanceToSquared(camera.position) > 0.000025 ||
      1 - Math.abs(previousCameraQuaternion.current.dot(camera.quaternion)) > 0.000001
    )
    cameraWasSampled.current = true
    previousCameraPosition.current.copy(camera.position)
    previousCameraQuaternion.current.copy(camera.quaternion)
    cameraStableSeconds.current = cameraMoved
      ? 0
      : cameraStableSeconds.current + delta
    labelRefreshSeconds.current += delta
    const canRepopulate = stationLabelsCanRepopulate(
      cameraStableSeconds.current,
      settleSeconds,
    ) || labelRefreshSeconds.current >= (stationStyle?.refreshInterval ?? Infinity)
    if (canRepopulate) labelRefreshSeconds.current = 0
    if (!stationLabelFrame.shouldUpdate(camera, size, canRepopulate, retainedStationNames.current)) return
    const budget = stableStationLabelBudget(
      stationLabelBudget(semanticHeight),
      retainedStationNames.current.size,
      canRepopulate,
    )
    const rankLimit = (stationStyle?.rankLimit ?? stationLabelRankLimit)(semanticHeight)
    const projected = new THREE.Vector3()
    const viewPosition = new THREE.Vector3()
    const candidates: Array<{
      index: number
      x: number
      y: number
      distance: number
      depth: number
      priority: number
      rank: number
      retained: boolean
    }> = []

    sprites.current.forEach((sprite) => {
      if (sprite) sprite.visible = false
    })
    if (hidden) {
      retainedStationNames.current.clear()
      stationLabelBoxes.set(camera, emptyLabelBoxes)
      return
    }

    labels.forEach((label, index) => {
      const retained = retainedStationNames.current.has(label.station.name)
      if ((selectedTrain || selectedRoute) && !label.emphasised) return
      if (
        !label.emphasised &&
        !(stationStyle?.eligible?.(label.station, semanticHeight, tierLimit) ?? stationLabelWithinTier(label.station.labelRank, tierLimit))
      ) return
      if (layoutTransitioning && !label.emphasised && !retained) return
      if (!label.emphasised && !retained && !canRepopulate) return
      if (
        !label.emphasised &&
        (label.rank < 0 || label.rank >= rankLimit) &&
        (canRepopulate || !retained)
      ) return

      viewPosition.copy(label.position).applyMatrix4(camera.matrixWorldInverse)
      projected.copy(label.position).project(camera)
      if (
        projected.z < -1 ||
        projected.z > 1 ||
        projected.x < -1.08 ||
        projected.x > 1.08 ||
        projected.y < -1.08 ||
        projected.y > 1.08
      ) {
        return
      }
      candidates.push({
        index,
        x: (projected.x * 0.5 + 0.5) * size.width,
        y: (-projected.y * 0.5 + 0.5) * size.height,
        distance: camera.position.distanceTo(label.position),
        depth: Math.max(0.01, -viewPosition.z),
        priority: stationLabelPriority(
          label.station.name, selectedStation?.name, terminalNames, label.emphasised,
        ),
        rank: label.rank,
        retained,
      })
    })

    candidates.sort((first, second) =>
      compareStationLabelCandidates(
        {
          name: labels[first.index].station.name,
          rank: first.rank,
          priority: first.priority,
          retained: first.retained,
          distance: first.distance,
        },
        {
          name: labels[second.index].station.name,
          rank: second.rank,
          priority: second.priority,
          retained: second.retained,
          distance: second.distance,
        },
      ),
    )
    const occupied: Array<{ left: number; right: number; top: number; bottom: number }> = []
    const visibleTextureNames = new Set<string>()
    const nextRetainedStationNames = new Set<string>()
    const verticalFieldOfView =
      camera instanceof THREE.PerspectiveCamera ? camera.fov : 44
    let visible = 0

    for (const candidate of candidates) {
      if (visible >= budget || visible >= MAX_STATION_LABELS) break
      const label = labels[candidate.index]
      const selected = label.station.name === selectedStation?.name
      const screenHeight = stationStyle?.screenHeight?.(size.width, selected || label.emphasised, label.station.labelRank, semanticHeight) ?? stationLabelScreenHeight(
        selected,
        label.emphasised,
        label.station.labelRank,
      )
      const width = stationLabelScreenWidth(label.displayName, screenHeight)
      const labelLeft = lineMapLabels
        ? candidate.x + 3
        : candidate.x - screenHeight * 0.34
      const box = {
        left: labelLeft,
        right: labelLeft + width,
        top: candidate.y - screenHeight * 0.5,
        bottom: candidate.y + screenHeight * 0.5,
      }
      const padding = stationStyle?.viewportPadding
      if (padding !== undefined && (box.left < padding || box.right > size.width - padding || box.top < padding || box.bottom > size.height - padding)) continue
      const overlaps = occupied.some(
        (other) =>
          mapLabelBoxesOverlap(box, other),
      )
      if (overlaps) continue

      const sprite = sprites.current[visible]
      if (!sprite) continue
      const textureKey = `${lineMapLabels ? 'line-map' : 'atlas'}:${label.station.name}`
      let textureEntry = textures.current.get(textureKey)
      if (!textureEntry) {
        textureEntry = stationLabelTexture(
          label.displayName,
          lineMapLabels ? 'line-map' : 'atlas',
        )
        textures.current.set(textureKey, textureEntry)
      } else {
        textures.current.delete(textureKey)
        textures.current.set(textureKey, textureEntry)
      }
      visibleTextureNames.add(textureKey)
      nextRetainedStationNames.add(label.station.name)
      sprite.visible = true
      sprite.position.copy(label.position)
      setScenePickMetadata(sprite, { target: { kind: 'station', value: label.station } })
      sprite.center.set(textureEntry.anchorX, 0.5)
      const worldHeight = stationLabelWorldHeight(
        candidate.depth,
        verticalFieldOfView,
        size.height,
        screenHeight,
      )
      sprite.scale.set(textureEntry.aspect * worldHeight, worldHeight, 1)
      const material = sprite.material as THREE.SpriteMaterial
      if (material.map !== textureEntry.texture) {
        material.map = textureEntry.texture
        material.needsUpdate = true
      }
      material.opacity = stationLabelOpacity(
        selected,
        label.emphasised,
        label.station.labelRank,
      )
      occupied.push(box)
      visible += 1
    }

    stationLabelBoxes.set(camera, occupied)
    if (!layoutTransitioning) {
      retainedStationNames.current = nextRetainedStationNames
    }

    if (textures.current.size > 192) {
      for (const [name, entry] of textures.current) {
        if (visibleTextureNames.has(name)) continue
        entry.texture.dispose()
        textures.current.delete(name)
        if (textures.current.size <= 192) break
      }
    }
  })

  return (
    <>
      {Array.from({ length: MAX_STATION_LABELS }, (_, index) => (
        <sprite
          key={index}
          ref={(sprite) => {
            sprites.current[index] = sprite
          }}
          visible={false}
          renderOrder={MAP_LAYER.stationLabel}
        >
          <spriteMaterial
            transparent
            opacity={0}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </>
  )
}

function trainLabelText(
  train: NetworkTrain,
  selected: boolean,
  compared = false,
): string {
  const identity = trainLabelIdentity(train.route, train.shortName)
  const delay = train.realtime?.delaySeconds
  const realtimeSuffix =
    train.realtime?.status === 'adjusted' && delay
      ? ` · ${delay > 0 ? '+' : '−'}${Math.round(Math.abs(delay) / 60)}′`
      : ''
  if (compared) {
    const comparisonIdentity = [train.shortName, train.servicePattern?.toUpperCase()]
      .filter(Boolean)
      .join(' · ')
    return `${comparisonIdentity || train.route}${realtimeSuffix} → ${train.headsign}`
  }
  return selected
    ? `${identity}${realtimeSuffix} → ${train.headsign}`
    : `${identity}${realtimeSuffix}`
}

export function TrainLabels({
  snapshot,
  projectedStops,
  projectedPaths,
  selectedTrain,
  comparisonTrains,
  selectedRoute,
  selectedStation,
  selectedCategory,
  airCategorySelected,
  roadCategorySelected,
  trainLabelMode,
  isPlaying,
  time,
  playbackRate,
  trainTimeIndex,
  cameraFraming,
  layoutTransitioning = false,
  routeColors,
  spatialLayoutMix = 0,
  routeColorMix = spatialLayoutMix,
  motion,
}: NationalNetworkSceneProps & {
  readonly projectedStops: readonly ProjectedStop[]
  readonly projectedPaths: readonly ProjectedNetworkPath[]
  readonly trainTimeIndex: TrainTimeIndex
  readonly motion: VehicleMotionTable
}) {
  const mapStyle = useMapStyle()
  const labelStyle = mapStyle.trainLabels
  const categoryColors = mapStyle.categoryColors
  const elevation = labelStyle?.elevation ?? 0.76
  const { camera, size } = useThree()
  const sprites = useRef<Array<THREE.Sprite | null>>([])
  const textures = useRef(new Map<string, TrainLabelTexture>())
  const retainedTrainIds = useRef(new Set<string>())
  const localTime = useRef(time)
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

  useEffect(() => {
    localTime.current = time
  }, [time])

  useEffect(
    () => () => {
      textures.current.forEach(({ texture }) => texture.dispose())
      textures.current.clear()
    },
    [],
  )

  const labelFrameBudget = useMemo(() => new LabelFrameBudget(), [])
  const labelPoint = useMemo(() => new Float32Array(3), [])
  const visibleLabelTrains = useRef<NetworkTrain[]>([])
  // These dependencies invalidate cached frame work when render inputs change.
  /* oxlint-disable react-hooks/exhaustive-deps */
  const labelInputs = useMemo(() => ({}), [mapStyle, motion, snapshot, projectedStops, projectedPaths,
    selectedTrain, comparisonTrains, selectedRoute, selectedStation, selectedCategory,
    airCategorySelected, roadCategorySelected, trainLabelMode, isPlaying, playbackRate,
    trainTimeIndex, cameraFraming, layoutTransitioning, routeColors, routeColorMix])
  /* oxlint-enable react-hooks/exhaustive-deps */
  useFrame((_, delta) => {
    if (isPlaying) {
      localTime.current += delta * playbackRate
      if (localTime.current > snapshot.metadata.windowEnd) {
        localTime.current = snapshot.metadata.windowStart
      }
    }

    const stationBoxes = labelStyle?.avoidStationLabels ? stationLabelBoxes.get(camera) ?? emptyLabelBoxes : emptyLabelBoxes
    const labelStale = motionStaleSeconds(isPlaying, playbackRate)
    const labelWork = labelFrameBudget.update(labelInputs, camera, size.width, size.height,
      localTime.current, delta, isPlaying, playbackRate, stationBoxes)
    if (labelWork === 'idle') return
    const labelTrains = labelWork === 'all' ? trainsNearTime(trainTimeIndex, localTime.current) : visibleLabelTrains.current
    visibleLabelTrains.current = []
    sprites.current.forEach((sprite) => {
      if (sprite) sprite.visible = false
    })
    const semanticCameraHeight = regionalCameraHeight(
      camera.position.y,
      cameraFraming,
    )
    const labelBudget = nonRailCategorySuppressesTrainLabels(
      airCategorySelected,
      roadCategorySelected,
    )
      ? 0
      : comparisonTrains?.length
        ? trainLabelMode === 'off'
          ? 0
          : comparisonTrains.length
      : selectedTrain
      ? trainLabelMode === 'off'
        ? 0
        : 1
      : styledTrainLabelBudget(labelStyle, semanticCameraHeight, size.width, trainLabelMode)
    if (!labelBudget) {
      retainedTrainIds.current.clear()
      return
    }

    const projected = new THREE.Vector3()
    const viewPosition = new THREE.Vector3()
    const candidates: Array<{
      train: NetworkTrain
      position: ProjectedStop
      x: number
      y: number
      depth: number
      selected: boolean
      retained: boolean
      arrivalOpacity: number
      comparisonIndex: number
    }> = []

    for (const train of labelTrains) {
      const selected =
        train.id === selectedTrain?.id || comparisonTrainIds.has(train.id)
      const retained = retainedTrainIds.current.has(train.id)
      if (comparisonTrains?.length && !selected) continue
      if (selectedTrain && !selected) continue
      if (layoutTransitioning && !selected && !retained) continue
      if (selectedRoute && !selectedRouteTrainIds.has(train.id)) continue
      if (!selected && selectedStation && !selectedStationTrainIds.has(train.id)) continue
      if (!selected && selectedCategory && train.category !== selectedCategory) continue
      const focused = Boolean(
        selected || selectedRoute || selectedStation || selectedCategory,
      )
      if (
        !vehicleIsVisibleAtZoom(
          train.category,
          camera.position.y,
          cameraFraming,
          focused,
        )
      ) {
        continue
      }
      if (
        !selected &&
        !focused &&
        !selectedCategory &&
        trainLabelMode === 'auto' &&
        !categoryIsVisibleInAutoMode(train.category, semanticCameraHeight)
      ) {
        continue
      }

      if (semanticCameraHeight >= (labelStyle?.maxCameraHeight?.[train.category] ?? Infinity)) continue
      const arrivalOpacity = trainLabelArrivalOpacity(
        localTime.current,
        train.end,
        playbackRate,
      )
      if (arrivalOpacity <= 0) continue
      // The motion layer schedules journeys on a frame budget; labels follow
      // the position it draws instead of sampling paths again.
      const trainIndex = motion.index.get(train)
      if (trainIndex === undefined || !motion.displayed(trainIndex, localTime.current, labelStale, labelPoint)) continue
      const position: ProjectedStop = [labelPoint[0], labelPoint[1], labelPoint[2]]
      projected.set(position[0], labelStyle?.screenOffset ? position[1] : elevation, position[2])
      viewPosition.copy(projected).applyMatrix4(camera.matrixWorldInverse)
      projected.project(camera)
      if (
        projected.z < -1 ||
        projected.z > 1 ||
        projected.x < -1.08 ||
        projected.x > 1.08 ||
        projected.y < -1.08 ||
        projected.y > 1.08
      ) {
        continue
      }
      candidates.push({
        train,
        position,
        x: (projected.x * 0.5 + 0.5) * size.width,
        y: (-projected.y * 0.5 + 0.5) * size.height,
        depth: Math.max(0.01, -viewPosition.z),
        selected,
        retained,
        arrivalOpacity,
        comparisonIndex: comparisonTrains?.findIndex(
          (candidate) => candidate.id === train.id,
        ) ?? -1,
      })
    }

    candidates.sort(
      (first, second) =>
        Number(second.selected) - Number(first.selected) ||
        compareTrainLabelCandidates(
          {
            id: first.train.id,
            category: first.train.category,
            retained: first.retained,
          },
          {
            id: second.train.id,
            category: second.train.category,
            retained: second.retained,
          },
        ),
    )

    const occupied = [...stationBoxes]
    const visibleTextureKeys = new Set<string>()
    const nextRetainedTrainIds = new Set<string>()
    const verticalFieldOfView =
      camera instanceof THREE.PerspectiveCamera ? camera.fov : 44
    let visible = 0

    for (const candidate of candidates) {
      if (visible >= labelBudget || visible >= MAX_TRAIN_LABELS) break
      const text = trainLabelText(
        candidate.train,
        candidate.selected,
        candidate.comparisonIndex >= 0,
      )
      const screenHeight = styledTrainLabelScreenHeight(
        labelStyle,
        size.width,
        candidate.selected,
        semanticCameraHeight,
      )
      const width = trainLabelScreenWidth(text, screenHeight) * (labelStyle?.collisionWidthScale ?? 1)
      const anchorY = candidate.comparisonIndex < 0 ? labelStyle?.anchorY ?? 0.5 : 0.5
      const screenOffset = labelStyle?.screenOffset?.(screenHeight, candidate.comparisonIndex) ?? 0
      const box = trainLabelCollisionBox(candidate.x, candidate.y + screenOffset, width, screenHeight, labelStyle?.screenOffset ? 0.5 : anchorY)
      const padding = labelStyle?.viewportPadding
      if (padding !== undefined && (box.left < padding || box.right > size.width - padding || box.top < padding || box.bottom > size.height - padding)) continue
      const overlaps = occupied.some(
        (other) =>
          mapLabelBoxesOverlap(box, other),
      )
      if (overlaps && !candidate.selected) continue

      const sprite = sprites.current[visible]
      if (!sprite) continue
      const textColor = labelStyle?.routeTextCategories?.includes(candidate.train.category) ? routeColors?.[candidate.train.route] : undefined
      const labelColor = textColor ?? mixedRouteColor(candidate.train.category, candidate.train.route, routeColors, routeColorMix, categoryColors)
      const textureKey = `${candidate.train.category}:${labelColor}:${textColor ?? ''}:${text}`
      let textureEntry = textures.current.get(textureKey)
      if (!textureEntry) {
        textureEntry = createTrainLabelTexture(text, labelColor, textColor)
        textures.current.set(textureKey, textureEntry)
      } else {
        textures.current.delete(textureKey)
        textures.current.set(textureKey, textureEntry)
      }
      visibleTextureKeys.add(textureKey)
      nextRetainedTrainIds.add(candidate.train.id)

      visibleLabelTrains.current.push(candidate.train)
      sprite.visible = true
      setScenePickMetadata(sprite, { target: { kind: 'train', value: candidate.train } })
      sprite.renderOrder = candidate.selected && labelStyle?.selectedAboveStations ? MAP_LAYER.stationLabel + 1 : MAP_LAYER.trainLabel
      sprite.center.set(0.5, labelStyle?.screenOffset ? 0.5 + screenOffset / screenHeight : anchorY)
      const comparisonOffset =
        candidate.comparisonIndex < 0
          ? 0
          : candidate.comparisonIndex === 0
            ? -0.22
            : 0.22
      sprite.position.set(
        candidate.position[0],
        labelStyle?.screenOffset ? candidate.position[1] : elevation + comparisonOffset,
        candidate.position[2],
      )
      const worldHeight = stationLabelWorldHeight(
        candidate.depth,
        verticalFieldOfView,
        size.height,
        screenHeight,
      )
      sprite.scale.set(textureEntry.aspect * worldHeight, worldHeight, 1)
      const material = sprite.material as THREE.SpriteMaterial
      if (material.map !== textureEntry.texture) {
        material.map = textureEntry.texture
        material.needsUpdate = true
      }
      material.opacity = (candidate.selected ? 1 : 0.9) * candidate.arrivalOpacity
      occupied.push(box)
      visible += 1
    }

    if (!layoutTransitioning) {
      retainedTrainIds.current = nextRetainedTrainIds
    }

    if (textures.current.size > 180) {
      for (const [key, entry] of textures.current) {
        if (visibleTextureKeys.has(key)) continue
        entry.texture.dispose()
        textures.current.delete(key)
        if (textures.current.size <= 180) break
      }
    }
  })

  return (
    <>
      {Array.from({ length: MAX_TRAIN_LABELS }, (_, index) => (
        <sprite
          key={index}
          ref={(sprite) => {
            sprites.current[index] = sprite
          }}
          visible={false}
          renderOrder={MAP_LAYER.trainLabel}
        >
          <spriteMaterial
            transparent
            opacity={0}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </>
  )
}

