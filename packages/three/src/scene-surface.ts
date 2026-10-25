import type { BufferGeometry } from 'three'
import { COPLANAR_MAP_SURFACE_Y } from './scene-style.ts'

export function mapSurfaceY(coplanar: boolean | undefined, fallback: number): number {
  return coplanar ? COPLANAR_MAP_SURFACE_Y : fallback
}

/** Only newly owned tube geometry is transformed; horizontal stroke widths stay intact. */
export function flattenMapTube<T extends BufferGeometry>(geometry: T, coplanar: boolean | undefined): T {
  if (coplanar) geometry.translate(0, -COPLANAR_MAP_SURFACE_Y, 0).scale(1, 0.001, 1).translate(0, COPLANAR_MAP_SURFACE_Y, 0)
  return geometry
}
