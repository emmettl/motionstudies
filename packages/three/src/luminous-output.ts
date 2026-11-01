import { Color, LinearSRGBColorSpace, NoToneMapping, type Camera, type WebGLRenderTarget, type Scene, type WebGLRenderer } from 'three'
import type { WebGPURenderer } from 'three/webgpu'

/** Explicit display-space additive composition for flat luminous scenes.
 * All node materials in this scene must use this binding. Other scenes should retain Three's normal linear pipeline. */
export function createLuminousOutput() {
  const encoding = { value: 0 }
  function render(renderer: WebGLRenderer | WebGPURenderer, scene: Scene, camera: Camera, target: WebGLRenderTarget | null = null): void {
    if (scene.background !== null) throw Error('Luminous output requires a clear-colour background')
    const previous = { colourSpace: renderer.outputColorSpace, toneMapping: renderer.toneMapping, encoding: encoding.value }
    const restoreTarget = 'isWebGLRenderer' in renderer
      ? (() => { const legacy = renderer as WebGLRenderer, previous = legacy.getRenderTarget(); return () => legacy.setRenderTarget(previous) })()
      : (() => { const node = renderer as WebGPURenderer, previous = node.getRenderTarget(); return () => node.setRenderTarget(previous) })()
    const display = 'isWebGPURenderer' in renderer && target === null
    const clear = renderer.getClearColor(new Color())
    const alpha = renderer.getClearAlpha()
    encoding.value = display ? 1 : 0
    if (display) {
      // Match legacy additive blending after its per-material display conversion.
      // This bypasses the node renderer's linear intermediate output pass for this draw only.
      renderer.outputColorSpace = LinearSRGBColorSpace; renderer.toneMapping = NoToneMapping
      renderer.setClearColor(clear.clone().convertLinearToSRGB(), alpha)
    }
    renderer.setRenderTarget(target)
    try { renderer.render(scene, camera) }
    finally {
      restoreTarget()
      if (display) { renderer.outputColorSpace = previous.colourSpace; renderer.toneMapping = previous.toneMapping; renderer.setClearColor(clear, alpha) }
      encoding.value = previous.encoding
    }
  }
  return { encoding, render }
}
export type LuminousOutput = ReturnType<typeof createLuminousOutput>
