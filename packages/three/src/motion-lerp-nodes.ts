import type { LineBasicNodeMaterial, PointsNodeMaterial } from 'three/webgpu'
import { attribute, clamp, max, mix, modelViewProjection, positionGeometry, reference, select, vec4 } from 'three/tsl'
import type { MotionUniforms } from './motion-lerp.ts'

/** The same positionTo/motionTime contract as the legacy GLSL adapter.
 * TSL generates WGSL or GLSL for WebGPURenderer's selected backend. */
export function createMotionLerpNodes(uniforms: MotionUniforms) {
  const clock = reference('value', 'float', uniforms.clock)
  const stale = reference('value', 'float', uniforms.stale)
  const window = attribute('motionTime', 'vec2')
  const span = max(window.y.sub(window.x), 1e-3)
  const phase = clamp(clock.sub(window.x).div(span), 0, 1)
  const positionNode = mix(positionGeometry, attribute('positionTo', 'vec3'), phase)
  const visibleNode = window.y.greaterThanEqual(window.x)
    .and(clock.lessThanEqual(window.y.add(stale)))
    .and(clock.greaterThanEqual(window.x.sub(stale)))
  // Hide in clip space, matching the existing point/line adapter on both APIs.
  const vertexNode = select(visibleNode, modelViewProjection, vec4(2, 2, 2, 1))
  return { positionNode, vertexNode, visibleNode }
}

export type MotionLerpNodes = ReturnType<typeof createMotionLerpNodes>

/** Regular Points and Line/LineSegments objects, with vertex-aligned attributes.
 * Owns positionNode and vertexNode. Larger native WebGPU glyphs need sprites;
 * instanced sprite and wide-line materials have separate vertex contracts. */
export function applyMotionLerpNodes(material: PointsNodeMaterial | LineBasicNodeMaterial, nodes: MotionLerpNodes): void {
  material.positionNode = nodes.positionNode
  material.vertexNode = nodes.vertexNode
  material.needsUpdate = true
}
