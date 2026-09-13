import type { NetworkTrain, StationIndexEntry } from '@motionstudies/core/domain/network'
import type { StudyAirport } from '@motionstudies/core/domain/airport'

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
