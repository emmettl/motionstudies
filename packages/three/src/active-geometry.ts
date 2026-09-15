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

const MOTION_ATTRIBUTES = ['position', 'positionTo', 'motionTime', 'color']

/**
 * Upload one contiguous range of changed vertices, `first` to `last` inclusive,
 * and draw `drawCount` vertices. An empty range (`last < first`) uploads nothing.
 */
export function updateDirtyGeometry(geometry: BufferGeometry, first: number, last: number, drawCount: number) {
  geometry.setDrawRange(0, drawCount)
  if (!(last >= first)) return
  for (const name of MOTION_ATTRIBUTES) {
    const attribute = geometry.getAttribute(name) as BufferAttribute | undefined
    if (!attribute) continue
    attribute.clearUpdateRanges()
    attribute.addUpdateRange(first * attribute.itemSize, (last - first + 1) * attribute.itemSize)
    attribute.needsUpdate = true
  }
}
