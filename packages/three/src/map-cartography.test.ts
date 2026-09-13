import { BufferGeometry, Float32BufferAttribute } from 'three'
import { expect, it } from 'vitest'
import { compactMapLines } from './map-cartography.ts'

it('removes repeated and reversed strokes without merging nearby tracks or adding brightness', () => {
  const geometry = new BufferGeometry()
    .setAttribute('position', new Float32BufferAttribute([
      0, 0, 0, 1, 0, 0,
      1, 0, 0, 0, 0, 0,
      0, 0, 0.01, 1, 0, 0.01,
      0, 0, 0, 0, 0, 0,
    ], 3))
    .setAttribute('color', new Float32BufferAttribute([
      0.2, 0.1, 0, 0.4, 0.2, 0,
      0.8, 0.3, 0, 0.3, 0.2, 0,
      1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1,
    ], 3))
  compactMapLines(geometry)
  expect(geometry.getAttribute('position').count).toBe(4)
  const colors = geometry.getAttribute('color')
  expect(colors.getX(0)).toBeCloseTo(0.3)
  expect(colors.getX(1)).toBeCloseTo(0.8)
  const once = Array.from(geometry.getAttribute('position').array)
  compactMapLines(geometry)
  expect(Array.from(geometry.getAttribute('position').array)).toEqual(once)
})

