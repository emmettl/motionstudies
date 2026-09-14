import { expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three'
import {
  boundsContain,
  createGroundBounds,
  expandBounds,
  groundViewBounds,
  segmentTouchesBounds,
} from './view-culling.ts'

function mapCamera(position: readonly [number, number, number], target = new Vector3()) {
  const camera = new PerspectiveCamera(44, 16 / 9, 0.1, 120)
  camera.position.set(...position)
  camera.lookAt(target)
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  return camera
}

it('projects the view onto the vehicle plane and contains what the camera can see', () => {
  const camera = mapCamera([0, 37, 26])
  const bounds = createGroundBounds()
  expect(groundViewBounds(camera, 0.2, bounds)).toBe(true)
  expect(bounds.minX).toBeLessThan(0)
  expect(bounds.maxX).toBeGreaterThan(0)
  expect(bounds.minX).toBeCloseTo(-bounds.maxX, 5)
  expect(bounds.minZ).toBeLessThan(0)
  expect(bounds.maxZ).toBeGreaterThan(0)
  // The far edge lies beyond the target, the near edge in front of the camera.
  expect(bounds.maxZ).toBeLessThan(26)
  const centre = new Vector3(0, 0.2, 0).project(camera)
  expect(Math.abs(centre.x)).toBeLessThan(1)
  expect(Math.abs(centre.y)).toBeLessThan(1)
  const outside = new Vector3(bounds.maxX * 1.5, 0.2, 0).project(camera)
  expect(Math.abs(outside.x)).toBeGreaterThan(1)
})

it('declines to cull when a view corner does not reach the plane', () => {
  const camera = mapCamera([0, 2, 0], new Vector3(0, 2, -10))
  expect(groundViewBounds(camera, 0.2, createGroundBounds())).toBe(false)
  const above = mapCamera([0, 37, 26])
  expect(groundViewBounds(above, 40, createGroundBounds())).toBe(false)
})

it('expands, contains and tests segments conservatively', () => {
  const bounds = { minX: -10, maxX: 10, minZ: -5, maxZ: 5 }
  const expanded = expandBounds(bounds, 0.5, createGroundBounds())
  expect(expanded).toEqual({ minX: -20, maxX: 20, minZ: -10, maxZ: 10 })
  expect(boundsContain(expanded, bounds)).toBe(true)
  expect(boundsContain(bounds, expanded)).toBe(false)
  expect(segmentTouchesBounds(0, 0, 1, 1, bounds)).toBe(true)
  expect(segmentTouchesBounds(-30, 0, -11, 0, bounds)).toBe(false)
  expect(segmentTouchesBounds(-30, 0, 11, 0, bounds)).toBe(true)
  expect(segmentTouchesBounds(0, 6, 0, 30, bounds)).toBe(false)
  expect(segmentTouchesBounds(11, -6, 30, -30, bounds)).toBe(false)
})
