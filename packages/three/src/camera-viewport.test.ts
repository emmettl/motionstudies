import { expect, it } from 'vitest'
import { PerspectiveCamera } from 'three'
import { createCameraViewportFraming } from './map-camera.ts'

it('leaves an unconfigured camera projection unchanged', () => {
  const camera = new PerspectiveCamera(), matrix = camera.projectionMatrix.clone()
  createCameraViewportFraming(camera)(undefined, { width: 390, height: 844 })
  expect(camera.view).toBeNull()
  expect(camera.projectionMatrix.equals(matrix)).toBe(true)
})
it('updates zoom and inset on resize, skips unchanged frames and releases standard framing', () => {
  const camera = new PerspectiveCamera(), framing = createCameraViewportFraming(camera)
  framing({ zoom: 0.8, offsetY: -104 }, { width: 1000, height: 800 })
  expect(camera.zoom).toBe(0.8)
  expect(camera.view?.offsetY).toBe(-104)
  const version = camera.projectionMatrix.clone()
  framing({ zoom: 0.8, offsetY: -104 }, { width: 1000, height: 800 })
  expect(camera.projectionMatrix.equals(version)).toBe(true)
  framing({ zoom: 1, offsetY: 0 }, { width: 390, height: 844 })
  expect(camera.view?.fullWidth).toBe(390)
  framing(undefined, { width: 390, height: 844 })
  expect(camera.zoom).toBe(1)
  expect(camera.view?.enabled).toBe(false)
  expect(camera.aspect).toBe(390 / 844)
  const standard = new PerspectiveCamera(camera.fov, 390 / 844, camera.near, camera.far)
  expect(camera.projectionMatrix.equals(standard.projectionMatrix)).toBe(true)
  framing()
  expect(camera.view?.enabled).toBe(false)
})
it('releases its projection override on teardown', () => {
  const camera = new PerspectiveCamera(), framing = createCameraViewportFraming(camera)
  framing({ zoom: 0.65, offsetY: -100 }, { width: 1440, height: 800 })
  framing()
  expect(camera.zoom).toBe(1)
  expect(camera.view?.enabled).toBe(false)
})
