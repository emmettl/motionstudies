import { expect, it } from 'vitest'
import { PerspectiveCamera, Vector3, TubeGeometry, LineCurve3 } from 'three'
import { selectionMarkerScale } from './selection-marker-scale.ts'
import { flattenMapTube, mapSurfaceY } from './scene-surface.ts'
import { COPLANAR_MAP_SURFACE_Y } from './scene-style.ts'

it('caps the projected marker radius at close and off-centre views without enlarging overview markers', () => {
  const camera = new PerspectiveCamera(45, 2, 0.01, 1000)
  camera.position.set(0, 0, 20); camera.updateMatrixWorld()
  for (const position of [new Vector3(0, 0, 19), new Vector3(3, 2, 12), new Vector3(0, 0, -200)]) {
    const scale = selectionMarkerScale(camera, position, 600, 0.535, 10)
    const centre = position.clone().project(camera)
    const edge = position.clone().add(new Vector3(0.535 * scale, 0, 0)).project(camera)
    expect(Math.abs(edge.x - centre.x) * 1200 / 2).toBeLessThanOrEqual(10.00001)
    expect(scale).toBeLessThanOrEqual(1)
  }
  expect(selectionMarkerScale(camera, new Vector3(0, 0, -200), 600, 0.535, 10)).toBe(1)
  expect(selectionMarkerScale(camera, new Vector3(), 0, 0.535, 10)).toBe(0)
})

it('compresses only the vertical extent of an owned map tube around the shared plane', () => {
  const original = new TubeGeometry(new LineCurve3(new Vector3(0, COPLANAR_MAP_SURFACE_Y, 0), new Vector3(2, COPLANAR_MAP_SURFACE_Y, 3)), 4, 0.1, 8)
  const flattened = flattenMapTube(original.clone(), true)
  original.computeBoundingBox(); flattened.computeBoundingBox()
  const before = original.boundingBox!.getSize(new Vector3()), after = flattened.boundingBox!.getSize(new Vector3())
  expect(after.x).toBeCloseTo(before.x); expect(after.z).toBeCloseTo(before.z)
  expect(after.y).toBeCloseTo(before.y * 0.001)
  expect(flattenMapTube(original, false)).toBe(original)
  expect(mapSurfaceY(false, 0.2)).toBe(0.2)
  expect(mapSurfaceY(true, 0.2)).toBe(COPLANAR_MAP_SURFACE_Y)
  original.dispose(); flattened.dispose()
})
