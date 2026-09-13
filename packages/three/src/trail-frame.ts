import type { BufferGeometry } from 'three'
import { updateActiveGeometry } from './active-geometry.ts'
import type { TrailFrame } from './scene-extensions.ts'

/** Validate the complete response before touching GPU buffers. A malformed backend
 * response must not leave half the segments displaying a different frame. */
export function applyTrailFrame(geometries: readonly BufferGeometry[], frame: TrailFrame) {
  if (frame.counts.length !== geometries.length) throw new RangeError('Trail frame segment count mismatch')
  geometries.forEach((geometry, index) => {
    const count = frame.counts[index]
    const length = count * 6
    if (!Number.isSafeInteger(count) || count < 0 ||
        (length > 0 && (!frame.positions[index] || !frame.colors[index] ||
        length > frame.positions[index].length || length > frame.colors[index].length)) ||
        length > geometry.getAttribute('position').array.length ||
        length > geometry.getAttribute('color').array.length) {
      throw new RangeError('Trail frame exceeds its buffer capacity')
    }
  })
  geometries.forEach((geometry, index) => {
    const count = frame.counts[index] * 2
    if (count > 0) {
      const positions = geometry.getAttribute('position').array as Float32Array
      const colors = geometry.getAttribute('color').array as Float32Array
      positions.set(frame.positions[index].subarray(0, count * 3))
      colors.set(frame.colors[index].subarray(0, count * 3))
    }
    updateActiveGeometry(geometry, count)
  })
}
