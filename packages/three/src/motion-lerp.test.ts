import { expect, it } from 'vitest'
import { LineBasicMaterial, PointsMaterial, ShaderLib } from 'three'
import {
  MOTION_HIDE_VERTEX,
  MOTION_LERP_VERTEX,
  applyMotionLerp,
  createMotionLerp,
  createMotionUniforms,
  motionLerpVertexShader,
} from './motion-lerp.ts'

it('replaces the vertex origin and hides empty or stale slots in point and line shaders', () => {
  for (const source of [ShaderLib.points.vertexShader, ShaderLib.basic.vertexShader]) {
    expect(source).toContain('#include <begin_vertex>')
    expect(source).toContain('#include <fog_vertex>')
    const shader = motionLerpVertexShader(source)
    expect(shader).toContain(MOTION_LERP_VERTEX)
    expect(shader).toContain(MOTION_HIDE_VERTEX)
    expect(shader).not.toContain('#include <begin_vertex>')
    expect(shader.match(/#include <fog_vertex>/g)).toHaveLength(1)
    expect(shader).toContain('attribute vec2 motionTime;')
    expect(shader.indexOf(MOTION_LERP_VERTEX)).toBeLessThan(shader.indexOf('gl_Position = vec4( 2.0'))
  }
})

it('shares one clock and stale uniform across materials and one program key', () => {
  const uniforms = createMotionUniforms()
  const lerp = createMotionLerp(uniforms)
  const points = new PointsMaterial()
  const lines = new LineBasicMaterial()
  applyMotionLerp(points, lerp)
  applyMotionLerp(lines, lerp)
  const compiled = { uniforms: {} as Record<string, unknown>, vertexShader: ShaderLib.points.vertexShader }
  points.onBeforeCompile(compiled as never, undefined as never)
  expect(compiled.uniforms.motionClock).toBe(uniforms.clock)
  expect(compiled.uniforms.motionStale).toBe(uniforms.stale)
  expect(points.customProgramCacheKey()).toBe(lines.customProgramCacheKey())
  expect(new PointsMaterial().customProgramCacheKey()).not.toBe(points.customProgramCacheKey())
})
