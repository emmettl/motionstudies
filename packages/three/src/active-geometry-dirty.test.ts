import { expect, it } from 'vitest'
import { BufferAttribute, BufferGeometry } from 'three'
import { updateDirtyGeometry } from './active-geometry.ts'

it('uploads one contiguous vertex range across motion attributes and sets the draw count', () => {
  const geometry = new BufferGeometry()
  for (const [name, size] of [['position', 3], ['positionTo', 3], ['motionTime', 2], ['color', 3]] as const) {
    geometry.setAttribute(name, new BufferAttribute(new Float32Array(10 * size), size))
  }
  updateDirtyGeometry(geometry, 2, 4, 10)
  expect(geometry.drawRange.count).toBe(10)
  expect(geometry.getAttribute('position').updateRanges).toEqual([{ start: 6, count: 9 }])
  expect(geometry.getAttribute('motionTime').updateRanges).toEqual([{ start: 4, count: 6 }])
  const version = geometry.getAttribute('color').version
  updateDirtyGeometry(geometry, Infinity, -Infinity, 0)
  expect(geometry.drawRange.count).toBe(0)
  expect(geometry.getAttribute('color').version).toBe(version)
})
