import { expect, it } from 'vitest'
import { Box3, BufferAttribute, BufferGeometry, Float32BufferAttribute, Sphere, Vector3 } from 'three'
import { prepareGeometryMorph, projectSpatialMorph, blendSpatialMorph, type SpatialMorphProjection } from './spatial-morph.ts'
import { prepareProjectedPath } from './network-paths.ts'
import type { NetworkProjection } from './NationalNetworkScene.tsx'

const projection: NetworkProjection = { centreLongitude: 0, centreLatitude: 0, longitudeScale: 1, scale: 1 }
const lens: SpatialMorphProjection = (x, z) => [x * 2 + 10, z * 0.5 - 4]
const points = Array.from({ length: 65 }, (_, i) => [i / 8, 0.2, Math.sin(i)] as const)

it('keeps source vertices, lengths and train positions aligned throughout reversal', () => {
  const paths = [prepareProjectedPath(points)], before = JSON.stringify(paths)
  const alternate = projectSpatialMorph(points, paths, projection, lens)
  const geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(points.flat(), 3))
  const attribute = geometry.getAttribute('position')
  const morph = prepareGeometryMorph(geometry, projection, lens)
  for (const mix of [0, 0.2, 0.5, 1, 0.7, 0]) {
    morph.update(mix)
    const blended = blendSpatialMorph(points, paths, alternate, mix)
    expect(blended.paths[0].points).toHaveLength(65)
    expect(blended.paths[0].length).toBeCloseTo(prepareProjectedPath(blended.paths[0].points).length)
    blended.paths[0].points.forEach((p, i) => p.forEach((v, axis) => expect(attribute.array[i * 3 + axis]).toBeCloseTo(v, 5)))
    expect(geometry.getAttribute('position')).toBe(attribute)
  }
  expect(blendSpatialMorph(points, paths, alternate, 0).paths).toBe(paths)
  expect(blendSpatialMorph(points, paths, alternate, 1)).toBe(alternate)
  expect(JSON.stringify(paths)).toBe(before)
  morph.restore(); geometry.dispose()
})

it('deduplicates cyclic resources, preserves topology and bounds both endpoints', () => {
  const geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute([0, 2, 0, 3, 2, 4], 3))
  geometry.setIndex([0, 1])
  const position = geometry.getAttribute('position') as BufferAttribute, index = geometry.index
  const resource: { geometry: BufferGeometry; duplicate: BufferGeometry; self?: unknown } = { geometry, duplicate: geometry }
  resource.self = resource
  let disposals = 0; geometry.addEventListener('dispose', () => disposals++)
  const morph = prepareGeometryMorph(resource, projection, lens)
  const version = position.version
  morph.update(0.5)
  expect(position.version).toBe(version + 1)
  expect(geometry.index).toBe(index)
  for (const mix of [-1, 0, 0.5, 1, 2]) {
    morph.update(mix)
    for (let i = 0; i < position.count; i++) {
      const p = new Vector3().fromBufferAttribute(position, i)
      expect(geometry.boundingBox?.containsPoint(p)).toBe(true)
      expect(geometry.boundingSphere?.containsPoint(p)).toBe(true)
    }
  }
  morph.restore()
  expect(Array.from(position.array)).toEqual([0, 2, 0, 3, 2, 4])
  expect(geometry.boundingSphere).toBeNull(); expect(geometry.boundingBox).toBeNull()
  expect(disposals).toBe(0)
  geometry.dispose(); expect(disposals).toBe(1)
})

it('restores existing bounds and source positions before a replacement projection', () => {
  const geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute([2, 1, 4], 3))
  geometry.boundingSphere = new Sphere(new Vector3(2, 1, 4), 3)
  geometry.boundingBox = new Box3(new Vector3(1, 0, 3), new Vector3(3, 2, 5))
  const sphere = geometry.boundingSphere.clone(), box = geometry.boundingBox.clone()
  const first = prepareGeometryMorph(geometry, projection, lens)
  first.update(0.7); first.restore()
  expect(geometry.boundingSphere).toEqual(sphere); expect(geometry.boundingBox).toEqual(box)
  const second = prepareGeometryMorph(geometry, projection, (x, z) => [x - 20, z + 5])
  second.update(1)
  expect(Array.from(geometry.getAttribute('position').array)).toEqual([-18, 1, 9])
  second.restore(); expect(Array.from(geometry.getAttribute('position').array)).toEqual([2, 1, 4])
  geometry.dispose()
})

it('ignores absent position buffers and rejects incompatible attributes', () => {
  const empty = new BufferGeometry(), morph = prepareGeometryMorph([empty, undefined], projection, lens)
  expect(() => { morph.update(0.5); morph.restore() }).not.toThrow()
  empty.setAttribute('position', new Float32BufferAttribute([1, 2], 2))
  expect(() => prepareGeometryMorph(empty, projection, lens)).toThrow('three-component')
  empty.dispose()
})


it('restores the original precision of non-Float32 position buffers', () => {
  const values = new Float64Array([1.1234567890123, 0, 2.9876543210987])
  const geometry = new BufferGeometry().setAttribute('position', new BufferAttribute(values.slice(), 3))
  const morph = prepareGeometryMorph(geometry, projection, lens)
  morph.update(0.5); morph.restore()
  expect(geometry.getAttribute('position').array).toEqual(values)
  geometry.dispose()
})
