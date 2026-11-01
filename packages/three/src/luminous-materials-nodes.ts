import { AdditiveBlending, SRGBColorSpace, type ColorRepresentation, type Texture } from 'three'
import { LineBasicNodeMaterial, MeshBasicNodeMaterial, type Node } from 'three/webgpu'
import { attribute, cameraProjectionMatrix, clamp, max, mix, modelViewMatrix, positionGeometry, reference, select, texture, uv, vec4, workingToColorSpace, materialColor, vec3 } from 'three/tsl'
import type { LuminousOutput } from './luminous-output.ts'
import type { MotionSpriteUniforms } from './motion-sprites.ts'

// r186 typings omit ColorSpaceNode's proxy extensions; its runtime output is a vec4.
const displayColour = (colour: Node<'vec3'>) => vec3(workingToColorSpace(vec4(colour, 1), SRGBColorSpace) as unknown as Node<'vec4'>)

/** Instanced quads avoid native WebGPU's point-size restriction. Owns vertex/colour/opacity nodes.
 * No frame-time attribute upload: mutate the supplied uniforms. Dispose the material separately from the caller's texture. */
export function createLuminousSpriteNodeMaterial(uniforms: MotionSpriteUniforms, map: Texture, output?: LuminousOutput): MeshBasicNodeMaterial {
  const clock = reference('value', 'float', uniforms.clock), stale = reference('value', 'float', uniforms.stale)
  const window = attribute('spriteWindow', 'vec2')
  const phase = clamp(clock.sub(window.x).div(max(window.y.sub(window.x), .001)), 0, 1)
  const centre = mix(attribute('spritePosition', 'vec3'), attribute('spritePositionTo', 'vec3'), phase)
  const clip = cameraProjectionMatrix.mul(modelViewMatrix.mul(vec4(centre, 1)))
  const offset = positionGeometry.xy.mul(attribute('spriteSize', 'float')).mul(2).div(reference('value', 'vec2', uniforms.viewport)).mul(clip.w)
  const visible = window.y.greaterThanEqual(window.x).and(clock.greaterThanEqual(window.x.sub(stale))).and(clock.lessThanEqual(window.y.add(stale)))
  const light = texture(map, uv())
  const material = new MeshBasicNodeMaterial({ transparent: true, blending: AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false })
  material.vertexNode = select(visible, vec4(clip.xy.add(offset), clip.zw), vec4(2, 2, 2, 1))
  const colour = attribute('spriteColour', 'vec3').mul(light.rgb)
  material.colorNode = output ? mix(colour, displayColour(colour), reference('value', 'float', output.encoding)) : colour
  material.opacityNode = light.a.mul(reference('value', 'float', uniforms.opacity))
  return material
}
export function createLuminousLineNodeMaterial(colour: ColorRepresentation, opacity = 1, output?: LuminousOutput): LineBasicNodeMaterial {
  const material = new LineBasicNodeMaterial({ color: colour, opacity, transparent: true, blending: AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false })
  if (output) material.colorNode = mix(materialColor, displayColour(materialColor), reference('value', 'float', output.encoding))
  return material
}
