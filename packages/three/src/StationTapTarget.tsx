import type { StationLabelStyle } from './scene-style.ts'
import type { NetworkSceneExtensions } from './scene-extensions.ts'
import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
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
  const { camera, gl, scene } = useThree()
  const rankedStations = useMemo(() => style?.orderStations?.(rankStationsForLabels(stations)) ?? rankStationsForLabels(stations), [stations, style])

  useEffect(() => {
    return installStationTapTarget({ style, spatialLayoutMix, accepts, scene, camera, element: gl.domElement, rankedStations, projectedStops, cameraFraming, onSelectStation })
  }, [camera, cameraFraming, gl, onSelectStation, projectedStops, rankedStations, style, spatialLayoutMix, accepts, scene])

  return null
}
