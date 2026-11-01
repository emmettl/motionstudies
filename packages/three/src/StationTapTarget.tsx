import { frameRenderer } from './frame-state.ts'
import type { StationLabelStyle } from './scene-style.ts'
import type { NetworkSceneExtensions } from './scene-extensions.ts'
import { useEffect, useMemo } from 'react'
import { useWebGLStudyState as useThree } from './webgl-study.ts'
import type { StationIndexEntry } from '@motionstudies/core/domain/network'
import type { MapCameraFraming } from './map-camera.ts'
import { rankStationsForLabels } from './station-labels.ts'
import { installStationTapTarget, type ProjectedStop } from './station-picking.ts'

export function StationTapTarget({
  stations,
  projectedStops,
  cameraFraming,
  onSelectStation,
  style, spatialLayoutMix = 0, accepts,
}: {
  readonly style?: StationLabelStyle
  readonly spatialLayoutMix?: number
  readonly accepts?: NetworkSceneExtensions['acceptsStationPick']
  readonly stations: readonly StationIndexEntry[]
  readonly projectedStops: readonly ProjectedStop[]
  readonly cameraFraming: MapCameraFraming
  readonly onSelectStation?: (station: StationIndexEntry) => void
}) {
  const state = useThree(), renderer = frameRenderer(state)
  const { camera, scene } = state
  const rankedStations = useMemo(() => style?.orderStations?.(rankStationsForLabels(stations)) ?? rankStationsForLabels(stations), [stations, style])

  useEffect(() => {
    return installStationTapTarget({ style, spatialLayoutMix, accepts, scene, camera, element: renderer.domElement, rankedStations, projectedStops, cameraFraming, onSelectStation })
  }, [camera, cameraFraming, renderer, onSelectStation, projectedStops, rankedStations, style, spatialLayoutMix, accepts, scene])

  return null
}
