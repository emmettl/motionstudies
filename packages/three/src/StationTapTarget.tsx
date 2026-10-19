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
}: {
  readonly stations: readonly StationIndexEntry[]
  readonly projectedStops: readonly ProjectedStop[]
  readonly cameraFraming: MapCameraFraming
  readonly onSelectStation?: (station: StationIndexEntry) => void
}) {
  const { camera, gl } = useThree()
  const rankedStations = useMemo(() => rankStationsForLabels(stations), [stations])

  useEffect(() => {
    return installStationTapTarget({ camera, element: gl.domElement, rankedStations, projectedStops, cameraFraming, onSelectStation })
  }, [camera, cameraFraming, gl, onSelectStation, projectedStops, rankedStations])

  return null
}
