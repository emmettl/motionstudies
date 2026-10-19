import { stationCentre } from './map-camera.ts'
export { stationCentre } from './map-camera.ts'
import type { StationLabelStyle } from './scene-style.ts'
import type { NetworkSceneExtensions } from './scene-extensions.ts'
import * as THREE from 'three'
import type { StationIndexEntry } from '@motionstudies/core/domain/network'
import type { MapCameraFraming } from './map-camera.ts'
import { stationLabelCameraHeight, stationLabelRankLimit,
  stationLabelScreenHeight, stationLabelScreenWidth, stationLabelText,
  stationIndexAtScreenPoint, stationTapRadius } from './station-labels.ts'

export type ProjectedStop = readonly [x: number, y: number, z: number]

/** Owns only station pointer listeners. The caller owns the camera and canvas;
 * no Three.js resources or scene context are retained beyond this installation.
 * The returned disposer removes all listeners when the scene or inputs retire.
 */
export function installStationTapTarget({ style, spatialLayoutMix = 0, accepts, scene, camera, element, rankedStations, projectedStops, cameraFraming, onSelectStation }: {
  readonly style?: StationLabelStyle
  readonly spatialLayoutMix?: number
  readonly accepts?: NetworkSceneExtensions['acceptsStationPick']
  readonly scene: THREE.Scene
  readonly camera: THREE.Camera
  readonly element: HTMLCanvasElement
  readonly rankedStations: readonly StationIndexEntry[]
  readonly projectedStops: readonly ProjectedStop[]
  readonly cameraFraming: MapCameraFraming
  readonly onSelectStation?: (station: StationIndexEntry) => void
}) {
  if (!onSelectStation) return
  const activePointers = new Map<
    number,
    { x: number; y: number; pointerType: string }
  >()
  let multiPointerGesture = false

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      pointerType: event.pointerType,
    })
    if (activePointers.size > 1) multiPointerGesture = true
    element.setPointerCapture(event.pointerId)
  }

  const finishPointer = (event: PointerEvent, cancelled: boolean) => {
    const start = activePointers.get(event.pointerId)
    activePointers.delete(event.pointerId)
    const wasMultiPointerGesture = multiPointerGesture
    if (activePointers.size === 0) multiPointerGesture = false
    if (!start || cancelled || wasMultiPointerGesture) return
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) {
      return
    }

    if (accepts && !accepts({ scene, camera, canvas: element, clientX: event.clientX, clientY: event.clientY, touch: start.pointerType === 'touch', dragDistance: Math.hypot(event.clientX - start.x, event.clientY - start.y) })) return
    const baseHeight = stationLabelCameraHeight(
      camera.position.y,
      cameraFraming,
    )
    const semanticHeight = style?.semanticHeight?.(baseHeight, spatialLayoutMix) ?? baseHeight
    const rankLimit = Math.min(
      rankedStations.length,
      (style?.rankLimit ?? stationLabelRankLimit)(semanticHeight),
    )
    const rect = element.getBoundingClientRect()
    const projected = new THREE.Vector3()
    const screenPoints = rankedStations
      .slice(0, rankLimit)
      .flatMap((station, index) => {
        if (style?.eligible && !style.eligible(station, semanticHeight)) return []
        projected.copy(stationCentre(station, projectedStops)).project(camera)
        if (
          projected.z < -1 ||
          projected.z > 1 ||
          projected.x < -1.05 ||
          projected.x > 1.05 ||
          projected.y < -1.05 ||
          projected.y > 1.05
        ) {
          return []
        }
        const x = (projected.x * 0.5 + 0.5) * rect.width
        const y = (-projected.y * 0.5 + 0.5) * rect.height
        const screenHeight = style?.screenHeight?.(rect.width, false, station.labelRank, semanticHeight) ?? stationLabelScreenHeight(false, false)
        const labelWidth = stationLabelScreenWidth(
          stationLabelText(station.name, cameraFraming),
          screenHeight,
        )
        const labelLeft = x - screenHeight * 0.34
        return [
          { index, x, y },
          { index, x: labelLeft + labelWidth * 0.48, y },
          { index, x: labelLeft + labelWidth * 0.86, y },
        ]
      })
    const selectedIndex = stationIndexAtScreenPoint(
      event.clientX - rect.left,
      event.clientY - rect.top,
      screenPoints,
      stationTapRadius(start.pointerType),
    )
    const station =
      selectedIndex === undefined ? undefined : rankedStations[selectedIndex]
    if (station) onSelectStation(station)
  }

  const onPointerUp = (event: PointerEvent) => finishPointer(event, false)
  const onPointerCancel = (event: PointerEvent) => finishPointer(event, true)
  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointerup', onPointerUp)
  element.addEventListener('pointercancel', onPointerCancel)
  return () => {
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointerup', onPointerUp)
    element.removeEventListener('pointercancel', onPointerCancel)
  }
}
