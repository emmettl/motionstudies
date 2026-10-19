import { Box3, BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three'
import type { NetworkProjection } from './NationalNetworkScene.tsx'
import { prepareProjectedPath, type ProjectedNetworkPath, type ProjectedPathPoint } from './network-paths.ts'
import { blendProjectedSpatialLayout } from './spatial-layout.ts'

/** Geographic world x/z to authored world x/z. Preserve source vertices and y; keep this callback stable. */
export type SpatialMorphProjection = (x: number, z: number, projection: NetworkProjection) => readonly [x: number, z: number]

export function projectSpatialMorph(stops: readonly ProjectedPathPoint[], paths: readonly ProjectedNetworkPath[], projection: NetworkProjection, project: SpatialMorphProjection) {
  const point = ([x, y, z]: ProjectedPathPoint): ProjectedPathPoint => {
    const [toX, toZ] = project(x, z, projection)
    return [toX, y, toZ]
  }
  return { stops: stops.map(point), paths: paths.map(path => prepareProjectedPath(path.points.map(point))) }
}

export function blendSpatialMorph(stops: readonly ProjectedPathPoint[], paths: readonly ProjectedNetworkPath[], alternate: ReturnType<typeof projectSpatialMorph> | undefined, mix: number) {
  return blendProjectedSpatialLayout(stops, paths, alternate, mix, true)
}

/** Retains geometry, attributes and topology. The caller owns disposal; restore before preparing another projection. */
export function prepareGeometryMorph(resource: unknown, projection: NetworkProjection, project: SpatialMorphProjection) {
  const geometries = new Set<BufferGeometry>(), visited = new WeakSet<object>()
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return
    visited.add(value)
    if (value instanceof BufferGeometry) geometries.add(value)
    else Object.values(value).forEach(visit)
  }
  visit(resource)
  const records = [...geometries].flatMap(geometry => {
    const position = geometry.getAttribute('position')
    if (!position) return []
    if (!(position instanceof BufferAttribute) || position.itemSize !== 3 || position.normalized) throw new Error('Spatial morph requires a non-normalized three-component BufferAttribute')
    const from = position.array.slice(), to = from.slice()
    const originalSphere = geometry.boundingSphere?.clone() ?? null
    const originalBox = geometry.boundingBox?.clone() ?? null
    const bounds = new Box3(), point = new Vector3()
    let radius = 0
    for (let i = 0; i < from.length; i += 3) {
      const [x, z] = project(from[i], from[i + 2], projection)
      to[i] = x; to[i + 2] = z
      bounds.expandByPoint(point.set(from[i], from[i + 1], from[i + 2]))
      bounds.expandByPoint(point.set(to[i], from[i + 1], to[i + 2]))
      radius = Math.max(radius, Math.hypot(from[i], from[i + 1], from[i + 2]), Math.hypot(to[i], from[i + 1], to[i + 2]))
    }
    geometry.boundingSphere = new Sphere(new Vector3(), radius + 0.1)
    geometry.boundingBox = bounds
    return [{ geometry, position, from, to, originalSphere, originalBox }]
  })
  return {
    update(mix: number) {
      const progress = Math.min(1, Math.max(0, mix))
      for (const { position, from, to } of records) {
        for (let i = 0; i < from.length; i++) position.array[i] = from[i] + (to[i] - from[i]) * progress
        position.needsUpdate = true
      }
    },
    restore() {
      for (const { geometry, position, from, originalSphere, originalBox } of records) {
        position.array.set(from); position.needsUpdate = true
        geometry.boundingSphere = originalSphere; geometry.boundingBox = originalBox
      }
    },
  }
}

