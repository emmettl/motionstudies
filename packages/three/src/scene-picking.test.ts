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
