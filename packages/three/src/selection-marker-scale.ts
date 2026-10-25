import { Camera, PerspectiveCamera, Vector3 } from 'three'

const cameraSpace = new Vector3()

/** Preserve overview size while capping a marker's CSS-pixel radius. */
export function selectionMarkerScale(camera: Camera, position: Vector3,
  viewportHeight: number, worldRadius: number, pixelRadius: number): number {
  if (viewportHeight <= 0) return 0
  cameraSpace.copy(position).applyMatrix4(camera.matrixWorldInverse)
  const depth = camera instanceof PerspectiveCamera ? Math.max(0, -cameraSpace.z) : 1
  const worldUnitsPerPixel = 2 * depth / (camera.projectionMatrix.elements[5] * viewportHeight)
  return Math.min(1, pixelRadius * worldUnitsPerPixel / worldRadius)
}
