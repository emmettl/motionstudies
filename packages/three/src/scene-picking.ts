import type { NetworkTrain, StationIndexEntry } from '@motionstudies/core/domain/network'
import type { StudyAirport } from '@motionstudies/core/domain/airport'
import type { BufferGeometry, Vector3 } from 'three'

export type ScenePickTarget =
  | { readonly kind: 'train'; readonly value: NetworkTrain }
  | { readonly kind: 'station'; readonly value: StationIndexEntry }
  | { readonly kind: 'airport'; readonly value: StudyAirport }

export interface ScenePickMetadata {
  readonly target?: ScenePickTarget
  /** Entries align with the rendered geometry's vertices. Respect its drawRange. */
  readonly trains?: readonly (NetworkTrain | undefined)[]
  readonly stopIndexes?: readonly number[]
}

const metadata = new WeakMap<object, ScenePickMetadata>()

/** Read metadata from an actual scene object or geometry; never retain disposed objects. */
export function scenePickMetadata(object: object): ScenePickMetadata | undefined {
  return metadata.get(object)
}

/** Edition-owned glyphs can publish the same metadata as the shared renderer. */
export function setScenePickMetadata(object: object, value: ScenePickMetadata | undefined): void {
  if (value) metadata.set(object, value.trains ? { ...value, trains: [...value.trains] } : value)
  else metadata.delete(object)
}

/** Update one active vertex without allocating a new array for every animation frame. */
export function setScenePickTrain(geometry: object, index: number, train: NetworkTrain | undefined): void {
  let value = metadata.get(geometry)
  if (!value?.trains) { value = { ...value, trains: [] }; metadata.set(geometry, value) }
  ;(value.trains as (NetworkTrain | undefined)[])[index] = train
}

const motionMix = new WeakMap<object, number>()
const motionClocks = new WeakMap<object, { readonly clock: number; readonly stale: number }>()

/** Record a single interpolation phase for geometry without per-vertex `motionTime` windows. */
export function setSceneMotionMix(geometry: object, mix: number): void {
  motionMix.set(geometry, mix)
}

/** Record the study time and stale tolerance drawn this frame for geometry with `motionTime` windows. */
export function setSceneMotionClock(geometry: object, clock: number, stale: number): void {
  motionClocks.set(geometry, { clock, stale })
}

/**
 * The displayed position of one vertex. Moving-vehicle geometry interpolates on
 * the GPU from `position` toward `positionTo` across each vertex's `motionTime`
 * window; picking must read the same point. Hidden vertices return NaN.
 */
export function scenePickVertex(geometry: BufferGeometry, index: number, out: Vector3): Vector3 {
  const position = geometry.getAttribute('position')
  out.fromBufferAttribute(position, index)
  const target = geometry.getAttribute('positionTo')
  if (!target) return out
  const windows = geometry.getAttribute('motionTime')
  const recorded = motionClocks.get(geometry)
  let mix: number
  if (windows && recorded) {
    const start = windows.getX(index)
    const end = windows.getY(index)
    if (end < start || recorded.clock > end + recorded.stale || recorded.clock < start - recorded.stale) {
      return out.set(NaN, NaN, NaN)
    }
    mix = Math.min(1, Math.max(0, (recorded.clock - start) / Math.max(end - start, 1e-3)))
  } else {
    mix = motionMix.get(geometry) ?? 0
  }
  if (!mix) return out
  out.x += (target.getX(index) - out.x) * mix
  out.y += (target.getY(index) - out.y) * mix
  out.z += (target.getZ(index) - out.z) * mix
  return out
}
