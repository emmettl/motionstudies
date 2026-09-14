import type { BufferAttribute, BufferGeometry } from 'three'

/** Upload only vertices used by this frame; unused capacity stays on the GPU.
 * Covers the interpolation target attribute when the geometry has one. */
export function updateActiveGeometry(geometry: BufferGeometry, count: number) {
  geometry.setDrawRange(0, count)
  for (const name of ['position', 'positionTo', 'color']) {
    const attribute = geometry.getAttribute(name) as BufferAttribute | undefined
    if (!attribute) continue
    attribute.clearUpdateRanges()
    if (count === 0) continue
    attribute.addUpdateRange(0, count * attribute.itemSize)
    attribute.needsUpdate = true
  }
}
