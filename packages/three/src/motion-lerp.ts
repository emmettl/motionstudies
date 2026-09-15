import type { Material, WebGLProgramParametersWithUniforms } from 'three'

/**
 * `clock` is the study time drawn this frame. `stale` is how far, in study
 * seconds, the clock may leave a vertex's window before the vertex is hidden.
 */
export interface MotionUniforms {
  readonly clock: { value: number }
  readonly stale: { value: number }
}

export interface MotionLerpProps {
  readonly onBeforeCompile: (shader: WebGLProgramParametersWithUniforms) => void
  readonly customProgramCacheKey: () => string
}

export const MOTION_LERP_DECLARATIONS =
  'attribute vec3 positionTo;\nattribute vec2 motionTime;\nuniform float motionClock;\nuniform float motionStale;\n'
export const MOTION_LERP_VERTEX =
  'float motionSpan = max( motionTime.y - motionTime.x, 1e-3 );\n' +
  'vec3 transformed = mix( position, positionTo, clamp( ( motionClock - motionTime.x ) / motionSpan, 0.0, 1.0 ) );'
/** A reversed window marks an empty slot; a clock far outside the window marks a slot not yet refreshed. */
export const MOTION_HIDE_VERTEX =
  'if ( motionTime.y < motionTime.x || motionClock > motionTime.y + motionStale || motionClock < motionTime.x - motionStale ) {\n' +
  '\tgl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );\n\tgl_PointSize = 0.0;\n}\n#include <fog_vertex>'

export function motionLerpVertexShader(source: string): string {
  return MOTION_LERP_DECLARATIONS + source
    .replace('#include <begin_vertex>', MOTION_LERP_VERTEX)
    .replace('#include <fog_vertex>', MOTION_HIDE_VERTEX)
}

export function createMotionUniforms(): MotionUniforms {
  return { clock: { value: 0 }, stale: { value: 0 } }
}

/**
 * Built-in point and line materials move each vertex from `position` toward
 * `positionTo` across its own `motionTime` window, so every journey can be
 * refreshed on its own schedule while all of them move every frame.
 */
export function createMotionLerp(uniforms: MotionUniforms): MotionLerpProps {
  return {
    onBeforeCompile: (shader) => {
      shader.uniforms.motionClock = uniforms.clock
      shader.uniforms.motionStale = uniforms.stale
      shader.vertexShader = motionLerpVertexShader(shader.vertexShader)
    },
    customProgramCacheKey: () => 'motion-lerp-windowed',
  }
}

export function applyMotionLerp(material: Material, props: MotionLerpProps): void {
  material.onBeforeCompile = props.onBeforeCompile
  material.customProgramCacheKey = props.customProgramCacheKey
  material.needsUpdate = true
}
