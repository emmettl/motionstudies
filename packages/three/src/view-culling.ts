import { Vector3, type Camera } from 'three'

export interface GroundBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export function createGroundBounds(): GroundBounds {
  return { minX: NaN, maxX: NaN, minZ: NaN, maxZ: NaN }
}

const origin = new Vector3()
const direction = new Vector3()

/**
 * The ground-plane rectangle covering the camera's view. Returns false when a
 * view corner does not reach the plane, in which case nothing may be culled.
 */
export function groundViewBounds(camera: Camera, planeY: number, out: GroundBounds): boolean {
  origin.setFromMatrixPosition(camera.matrixWorld)
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (let corner = 0; corner < 4; corner += 1) {
    direction.set(corner & 1 ? 1 : -1, corner & 2 ? 1 : -1, 0.5).unproject(camera).sub(origin)
    if (!(direction.y < -1e-9)) return false
    const distance = (planeY - origin.y) / direction.y
    if (!(distance > 0)) return false
    const x = origin.x + direction.x * distance
    const z = origin.z + direction.z * distance
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  out.minX = minX
  out.maxX = maxX
  out.minZ = minZ
  out.maxZ = maxZ
  return true
}

/** Grow a rectangle by a fraction of its own extent on every side. */
export function expandBounds(bounds: GroundBounds, fraction: number, out: GroundBounds): GroundBounds {
  const width = (bounds.maxX - bounds.minX) * fraction
  const depth = (bounds.maxZ - bounds.minZ) * fraction
  out.minX = bounds.minX - width
  out.maxX = bounds.maxX + width
  out.minZ = bounds.minZ - depth
  out.maxZ = bounds.maxZ + depth
  return out
}

export function boundsContain(outer: GroundBounds, inner: GroundBounds): boolean {
  return inner.minX >= outer.minX && inner.maxX <= outer.maxX &&
    inner.minZ >= outer.minZ && inner.maxZ <= outer.maxZ
}

/** Conservative: a segment whose bounding box overlaps the rectangle may be visible. */
export function segmentTouchesBounds(
  ax: number, az: number, bx: number, bz: number, bounds: GroundBounds,
): boolean {
  return !(
    (ax < bounds.minX && bx < bounds.minX) ||
    (ax > bounds.maxX && bx > bounds.maxX) ||
    (az < bounds.minZ && bz < bounds.minZ) ||
    (az > bounds.maxZ && bz > bounds.maxZ)
  )
}
