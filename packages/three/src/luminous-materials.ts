import { AdditiveBlending, LineBasicMaterial, ShaderMaterial, type Texture, type ColorRepresentation } from 'three'
import type { MotionSpriteUniforms } from './motion-sprites.ts'

/** Legacy implementation of the same instanced, screen-space glyph contract as the node material.
 * Also serves selection halos: caller supplies its authored orb/halo/spark texture. */
export function createLuminousSpriteMaterial(uniforms: MotionSpriteUniforms, map: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { clock: uniforms.clock, stale: uniforms.stale, viewport: uniforms.viewport, opacity: uniforms.opacity, lightMap: { value: map } },
    vertexShader: `attribute vec3 spritePosition; attribute vec3 spritePositionTo; attribute vec2 spriteWindow;
      attribute vec3 spriteColour; attribute float spriteSize; uniform float clock; uniform float stale; uniform vec2 viewport;
      varying vec2 vUv; varying vec3 vColour;
      void main() {
        float phase = clamp((clock - spriteWindow.x) / max(spriteWindow.y - spriteWindow.x, .001), 0., 1.);
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(mix(spritePosition, spritePositionTo, phase), 1.);
        clip.xy += position.xy * spriteSize * 2. / viewport * clip.w;
        if (spriteWindow.y < spriteWindow.x || clock < spriteWindow.x - stale || clock > spriteWindow.y + stale) clip = vec4(2.,2.,2.,1.);
        gl_Position = clip; vUv = uv; vColour = spriteColour;
      }`,
    fragmentShader: `uniform sampler2D lightMap; uniform float opacity; varying vec2 vUv; varying vec3 vColour;
      void main() { vec4 light = texture2D(lightMap, vUv); gl_FragColor = vec4(vColour * light.rgb, light.a * opacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    transparent: true, blending: AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false,
  })
}
/** Static geography, routes or motion-adapted trails share the same line styling. */
export function createLuminousLineMaterial(colour: ColorRepresentation, opacity = 1): LineBasicMaterial {
  return new LineBasicMaterial({ color: colour, opacity, transparent: true, blending: AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false })
}
