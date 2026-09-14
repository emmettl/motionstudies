import type { Material, Vector2, WebGLProgramParametersWithUniforms } from 'three'

/** x: marker phase inside the sampling window; y: trail phase inside the history grid. */
export interface MotionMixUniform {
  readonly value: Vector2
}

export interface MotionLerpProps {
  readonly onBeforeCompile: (shader: WebGLProgramParametersWithUniforms) => void
  readonly customProgramCacheKey: () => string
}

export interface MotionLerp {
  /** Points and single-phase vertices follow the marker phase. */
  readonly points: MotionLerpProps
  /** Trail vertices choose the marker or trail phase through a `motionPhase` attribute. */
  readonly phased: MotionLerpProps
}

const ATTRIBUTES = 'attribute vec3 positionTo;\nuniform vec2 motionMix;\n'
const PHASE_ATTRIBUTE = 'attribute float motionPhase;\n'
export const MOTION_LERP_POINTS = 'vec3 transformed = mix( position, positionTo, motionMix.x );'
export const MOTION_LERP_PHASED =
  'vec3 transformed = mix( position, positionTo, mix( motionMix.x, motionMix.y, motionPhase ) );'

export function motionLerpVertexShader(source: string, phased: boolean): string {
  const declarations = phased ? ATTRIBUTES + PHASE_ATTRIBUTE : ATTRIBUTES
  return declarations + source.replace(
    '#include <begin_vertex>',
    phased ? MOTION_LERP_PHASED : MOTION_LERP_POINTS,
  )
}

/**
 * Built-in materials move their vertices from `position` toward `positionTo`
 * on the GPU, so buffers need uploading only when the sampling window moves.
 */
export function createMotionLerp(uniform: MotionMixUniform): MotionLerp {
  const props = (phased: boolean): MotionLerpProps => ({
    onBeforeCompile: (shader) => {
      shader.uniforms.motionMix = uniform
      shader.vertexShader = motionLerpVertexShader(shader.vertexShader, phased)
    },
    customProgramCacheKey: () => (phased ? 'motion-lerp-phased' : 'motion-lerp-points'),
  })
  return { points: props(false), phased: props(true) }
}

export function applyMotionLerp(material: Material, props: MotionLerpProps): void {
  material.onBeforeCompile = props.onBeforeCompile
  material.customProgramCacheKey = props.customProgramCacheKey
  material.needsUpdate = true
}
