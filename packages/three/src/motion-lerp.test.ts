import { expect, it } from 'vitest'
import { LineBasicMaterial, PointsMaterial, ShaderChunk, ShaderLib, Vector2 } from 'three'
import {
  MOTION_LERP_PHASED,
  MOTION_LERP_POINTS,
  applyMotionLerp,
  createMotionLerp,
  motionLerpVertexShader,
} from './motion-lerp.ts'

it('replaces the built-in vertex origin in the point and line shaders', () => {
  for (const source of [ShaderLib.points.vertexShader, ShaderLib.basic.vertexShader]) {
    expect(source).toContain('#include <begin_vertex>')
    const points = motionLerpVertexShader(source, false)
    expect(points).toContain(MOTION_LERP_POINTS)
    expect(points).not.toContain('#include <begin_vertex>')
    expect(points).toContain('attribute vec3 positionTo;')
    expect(points).not.toContain('motionPhase')
    const phased = motionLerpVertexShader(source, true)
    expect(phased).toContain(MOTION_LERP_PHASED)
    expect(phased).toContain('attribute float motionPhase;')
  }
  expect(ShaderChunk.begin_vertex).toContain('vec3 transformed = vec3( position );')
})

it('shares one uniform across materials and keys their programs apart', () => {
  const uniform = { value: new Vector2(0.25, 0.5) }
  const lerp = createMotionLerp(uniform)
  const points = new PointsMaterial()
  const lines = new LineBasicMaterial()
  applyMotionLerp(points, lerp.points)
  applyMotionLerp(lines, lerp.phased)
  const compiled = { uniforms: {} as Record<string, unknown>, vertexShader: ShaderLib.points.vertexShader }
  points.onBeforeCompile(compiled as never, undefined as never)
  expect(compiled.uniforms.motionMix).toBe(uniform)
  expect(compiled.vertexShader).toContain(MOTION_LERP_POINTS)
  expect(points.customProgramCacheKey()).not.toBe(lines.customProgramCacheKey())
  expect(new PointsMaterial().customProgramCacheKey()).not.toBe(points.customProgramCacheKey())
})
