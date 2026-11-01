import { Float32BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry, Matrix4, Vector2, Vector3, WebGPUCoordinateSystem, type Camera, type Mesh } from 'three'
import type { MotionUniforms } from './motion-lerp.ts'

/** One instance per glyph. Positions are local coordinates, colours linear RGB, sizes CSS pixels.
 * A reversed window hides a slot. Caller owns and disposes geometry and materials. */
export interface MotionSpriteData {
  readonly positions: Float32Array
  readonly positionsTo: Float32Array
  readonly windows: Float32Array
  readonly colours: Float32Array
  readonly sizes: Float32Array
}
export interface MotionSpriteUniforms extends MotionUniforms {
  readonly viewport: { value: Vector2 }
  readonly opacity: { value: number }
}
export function createMotionSpriteUniforms(): MotionSpriteUniforms {
  return { clock: { value: 0 }, stale: { value: 0 }, viewport: { value: new Vector2(1, 1) }, opacity: { value: 1 } }
}
export function createMotionSpriteGeometry(data: MotionSpriteData): InstancedBufferGeometry {
  const count = data.sizes.length
  if (data.positions.length !== count * 3 || data.positionsTo.length !== count * 3 || data.windows.length !== count * 2 || data.colours.length !== count * 3 ||
    Object.values(data).some(values => !values.every(Number.isFinite)) || data.sizes.some(value => value < 0)) throw Error('Invalid motion sprite data')
  const geometry = new InstancedBufferGeometry()
  geometry.setIndex([0, 1, 2, 0, 2, 3])
  geometry.setAttribute('position', new Float32BufferAttribute([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0], 3))
  geometry.setAttribute('uv', new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2))
  for (const [name, values, size] of [
    ['spritePosition', data.positions, 3], ['spritePositionTo', data.positionsTo, 3],
    ['spriteWindow', data.windows, 2], ['spriteColour', data.colours, 3], ['spriteSize', data.sizes, 1],
  ] as const) geometry.setAttribute(name, new InstancedBufferAttribute(values, size))
  geometry.instanceCount = count
  // Ordinary bounds cover the quad, not the shader-moved instances. Use conservative caller culling.
  return geometry
}
export function motionSpritePosition(data: MotionSpriteData, index: number, uniforms: MotionUniforms, target = new Vector3()): Vector3 | null {
  if (!Number.isInteger(index) || index < 0 || index >= data.sizes.length) return null
  const start = data.windows[index * 2], end = data.windows[index * 2 + 1], clock = Math.fround(uniforms.clock.value), stale = Math.fround(uniforms.stale.value)
  if (end < start || clock < Math.fround(start - stale) || clock > Math.fround(end + stale)) return null
  const phase = Math.min(1, Math.max(0, Math.fround(clock - start) / Math.max(Math.fround(end - start), .001)))
  return target.fromArray(data.positions, index * 3).lerp(new Vector3().fromArray(data.positionsTo, index * 3), phase)
}
/** Screen-space hit test follows the same interpolated centres as the shader. Nearest centre wins.
 * Supply pointer in NDC and the same CSS viewport as the material. Does not mutate the clock. */
export function pickMotionSprite(data: MotionSpriteData, uniforms: MotionSpriteUniforms, pointer: Vector2, camera: Camera, mesh: Mesh): number | null {
  if (uniforms.opacity.value <= 0) return null
  const position = new Vector3(), projection = new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  mesh.updateWorldMatrix(true, false)
  let picked: number | null = null, nearest = Infinity
  for (let index = 0; index < data.sizes.length; index++) {
    if (data.sizes[index] <= 0 || !motionSpritePosition(data, index, uniforms, position)) continue
    position.applyMatrix4(mesh.matrixWorld).applyMatrix4(projection)
    if (position.z < (camera.coordinateSystem === WebGPUCoordinateSystem ? 0 : -1) || position.z > 1) continue
    const distance = Math.hypot((pointer.x - position.x) * uniforms.viewport.value.x / 2, (pointer.y - position.y) * uniforms.viewport.value.y / 2)
    if (distance <= data.sizes[index] / 2 && distance < nearest) { picked = index; nearest = distance }
  }
  return picked
}
