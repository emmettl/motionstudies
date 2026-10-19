import { expect, it, vi } from 'vitest'
import * as THREE from 'three'
import type { StationIndexEntry } from '@motionstudies/core/domain/network'
import { ATLAS_MAP_FRAMING } from './map-camera.ts'
import { installStationTapTarget, stationCentre } from './station-picking.ts'

const station: StationIndexEntry = { name: 'Central', stopIndexes: [0], trainIds: [], routes: [] }
function setup(onSelectStation = vi.fn(), options: Partial<Parameters<typeof installStationTapTarget>[0]> = {}) {
  const target = new EventTarget()
  const element = Object.assign(target, {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    setPointerCapture: vi.fn(),
  }) as unknown as HTMLCanvasElement
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100)
  camera.position.set(0, 10, 0); camera.up.set(0, 0, -1); camera.lookAt(0, 0, 0); camera.updateMatrixWorld()
  const dispose = installStationTapTarget({ scene: new THREE.Scene(), camera, element, rankedStations: [station], projectedStops: [[0, 0, 0]], cameraFraming: ATLAS_MAP_FRAMING, onSelectStation, ...options })!
  const pointer = (type: string, values = {}) => target.dispatchEvent(Object.assign(new Event(type), {
    pointerId: 1, pointerType: 'mouse', button: 0, clientX: 50, clientY: 50, ...values,
  }))
  return { dispose, pointer, onSelectStation }
}
it('uses available platform positions for the station centre', () => {
  expect(stationCentre({ ...station, stopIndexes: [0, 1, 99] }, [[2, 4, 6], [4, 8, 10]]).toArray()).toEqual([3, 0, 8])
})
it.each(['mouse', 'touch', 'pen'])('selects the station on a %s tap', pointerType => {
  const { pointer, onSelectStation, dispose } = setup()
  pointer('pointerdown', { pointerType }); pointer('pointerup', { pointerType })
  expect(onSelectStation).toHaveBeenCalledExactlyOnceWith(station)
  dispose()
})
it('ignores dragging, cancelled gestures, secondary mouse buttons and off-map taps', () => {
  const { pointer, onSelectStation, dispose } = setup()
  pointer('pointerdown'); pointer('pointerup', { clientX: 70 })
  pointer('pointerdown'); pointer('pointercancel'); pointer('pointerup')
  pointer('pointerdown', { button: 2 }); pointer('pointerup', { button: 2 })
  pointer('pointerdown', { clientX: 0, clientY: 0 }); pointer('pointerup', { clientX: 0, clientY: 0 })
  expect(onSelectStation).not.toHaveBeenCalled()
  dispose()
})
it('does not select either finger during a multi-pointer gesture', () => {
  const { pointer, onSelectStation, dispose } = setup()
  pointer('pointerdown', { pointerType: 'touch' })
  pointer('pointerdown', { pointerType: 'touch', pointerId: 2 })
  pointer('pointerup', { pointerType: 'touch' })
  pointer('pointerup', { pointerType: 'touch', pointerId: 2 })
  expect(onSelectStation).not.toHaveBeenCalled()
  dispose()
})
it('removes listeners on teardown even during a pending gesture', () => {
  const { pointer, onSelectStation, dispose } = setup()
  pointer('pointerdown'); dispose(); pointer('pointerup')
  pointer('pointerdown'); pointer('pointerup')
  expect(onSelectStation).not.toHaveBeenCalled()
})

it('uses the shared eligibility and sizing policy without changing station identity', () => {
  const blocked = { ...station, name: 'Blocked' }, chosen = { ...station, name: 'Chosen' }
  const height = vi.fn(() => 20), eligible = vi.fn(value => value === chosen), screenHeight = vi.fn(() => 32)
  const { pointer, onSelectStation, dispose } = setup(vi.fn(), {
    rankedStations: [blocked, chosen],
    style: { semanticHeight: height, eligible, screenHeight, rankLimit: () => Infinity }, spatialLayoutMix: 0.5,
  })
  pointer('pointerdown'); pointer('pointerup')
  expect(onSelectStation).toHaveBeenCalledExactlyOnceWith(chosen)
  expect(height).toHaveBeenCalledWith(expect.any(Number), 0.5)
  expect(screenHeight).toHaveBeenCalledWith(100, false, undefined, 20)
  dispose()
})
it('lets another visible target refuse a station tap after gesture validation', () => {
  const accepts = vi.fn(() => false)
  const { pointer, onSelectStation, dispose } = setup(vi.fn(), { accepts })
  pointer('pointerdown', { pointerType: 'touch' }); pointer('pointerup', { pointerType: 'touch' })
  expect(accepts).toHaveBeenCalledWith(expect.objectContaining({ clientX: 50, clientY: 50, touch: true, dragDistance: 0 }))
  expect(onSelectStation).not.toHaveBeenCalled()
  dispose()
  pointer('pointerdown'); pointer('pointerup')
  expect(accepts).toHaveBeenCalledTimes(1)
})
