import { expect, it } from 'vitest'
import { Vector3 } from 'three'
import { stationCentre } from './map-camera.ts'

it('shares the station centre with picking and resets a reused target including missing/empty stops', () => {
  const station = { name: 'Interchange', trainIds: [], routes: [], stopIndexes: [0, 1, 99] }
  const target = new Vector3(99, 99, 99)
  expect(stationCentre(station, [[2, 9, 4], [6, 7, 8]], target)).toBe(target)
  expect(target.toArray()).toEqual([4, 0, 6])
  expect(stationCentre(station, [], target).toArray()).toEqual([0, 0, 0])
})
