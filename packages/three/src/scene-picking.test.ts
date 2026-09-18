import { expect, it } from 'vitest'
import type { NetworkTrain } from '@motionstudies/core/domain/network'
import { scenePickMetadata, setScenePickMetadata, setScenePickTrain } from './scene-picking.ts'

const train: NetworkTrain = { id: 'one', route: '1', category: 'regional', headsign: 'Terminus', shortName: '1', start: 0, end: 60, stops: [[0, 0, 0], [1, 60, 60]] }

it('keeps metadata scoped to actual objects and supports explicit removal', () => {
  const first = {}, second = {}
  setScenePickMetadata(first, { target: { kind: 'train', value: train }, stopIndexes: [2, 5] })
  expect(scenePickMetadata(first)?.target?.value).toBe(train)
  expect(scenePickMetadata(second)).toBeUndefined()
  setScenePickMetadata(first, undefined)
  expect(scenePickMetadata(first)).toBeUndefined()
})

it('updates active vertices, clears filtered entries and preserves other geometry metadata', () => {
  const geometry = {}, original = Object.freeze([train])
  setScenePickMetadata(geometry, { trains: original, stopIndexes: [4] })
  setScenePickTrain(geometry, 0, undefined)
  setScenePickTrain(geometry, 1, { ...train, id: 'two' })
  expect(original[0]).toBe(train)
  expect(scenePickMetadata(geometry)?.trains?.map(item => item?.id)).toEqual([undefined, 'two'])
  expect(scenePickMetadata(geometry)?.stopIndexes).toEqual([4])
  const retained = scenePickMetadata(geometry)?.trains
  setScenePickTrain(geometry, 1, train)
  expect(scenePickMetadata(geometry)?.trains).toBe(retained)
  setScenePickMetadata(geometry, undefined)
  setScenePickTrain(geometry, 0, train)
  expect(scenePickMetadata(geometry)?.trains).toEqual([train])
})

it('reads displayed vertices from per-vertex windows and hides stale or empty slots', async () => {
  const { BufferAttribute, BufferGeometry, Vector3 } = await import('three')
  const { scenePickVertex, setSceneMotionClock } = await import('./scene-picking.ts')
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 5, 5, 5]), 3))
  geometry.setAttribute('positionTo', new BufferAttribute(new Float32Array([10, 0, -10, 5, 5, 5]), 3))
  geometry.setAttribute('motionTime', new BufferAttribute(new Float32Array([100, 110, 1, 0]), 2))
  const out = new Vector3()
  expect(scenePickVertex(geometry, 0, out).toArray()).toEqual([0, 0, 0])
  setSceneMotionClock(geometry, 105, 30)
  expect(scenePickVertex(geometry, 0, out).toArray()).toEqual([5, 0, -5])
  expect(scenePickVertex(geometry, 1, out).toArray().every(Number.isNaN)).toBe(true)
  setSceneMotionClock(geometry, 150, 30)
  expect(scenePickVertex(geometry, 0, out).toArray().every(Number.isNaN)).toBe(true)
  setSceneMotionClock(geometry, 130, 30)
  expect(scenePickVertex(geometry, 0, out).toArray()).toEqual([10, 0, -10])
})

it.each([28187.0874, 28187.0882])('picks a paused marker at fractional clock %s as the GPU does', async clock => {
  const { BufferAttribute, BufferGeometry, Vector3 } = await import('three')
  const { scenePickVertex, setSceneMotionClock } = await import('./scene-picking.ts')
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([2, 3, 4]), 3))
  geometry.setAttribute('positionTo', new BufferAttribute(new Float32Array([2, 3, 4]), 3))
  // Attributes and the shader's clock uniform both use float32. JavaScript's
  // unrounded clock can fall just outside this zero-duration paused window.
  geometry.setAttribute('motionTime', new BufferAttribute(new Float32Array([clock, clock]), 2))
  setSceneMotionClock(geometry, clock, 0)
  expect(scenePickVertex(geometry, 0, new Vector3()).toArray()).toEqual([2, 3, 4])
  setSceneMotionClock(geometry, clock + 1, 0)
  expect(scenePickVertex(geometry, 0, new Vector3()).toArray().every(Number.isNaN)).toBe(true)
})
