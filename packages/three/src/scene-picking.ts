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

/** Record the GPU interpolation phase of a geometry whose vertices move toward `positionTo`. */
export function setSceneMotionMix(geometry: object, mix: number): void {
  motionMix.set(geometry, mix)
}

/**
 * The displayed position of one vertex. Moving-vehicle geometry interpolates on
 * the GPU between `position` and `positionTo`; picking must read the same point.
 */
export function scenePickVertex(geometry: BufferGeometry, index: number, out: Vector3): Vector3 {
  const position = geometry.getAttribute('position')
  out.fromBufferAttribute(position, index)
  const target = geometry.getAttribute('positionTo')
  const mix = motionMix.get(geometry)
  if (!target || !mix) return out
  out.x += (target.getX(index) - out.x) * mix
  out.y += (target.getY(index) - out.y) * mix
  out.z += (target.getZ(index) - out.z) * mix
  return out
}
