import { editionDebugOptions, type DebugRendererOptions, type EditionDebugConfig } from './debug.ts'
import type { WebGPURenderer } from 'three/webgpu'

export type NodeDebugRenderer = WebGPURenderer
export type NodeDebugTarget = Pick<DebugRendererOptions, 'label' | 'redraw' | 'metadata'>
export interface NodeDebugSession {
  /** After renderer.init(), before constructing materials or GPU resources. */
  observe(renderer: NodeDebugRenderer): Promise<void>
  /** One panel for the renderer observed by this session. No render loop is added. */
  mount(target: NodeDebugTarget): void
  /** Call before disposing the renderer. Restores hooks and releases the panel. */
  dispose(): void
}

/** Opt-in diagnostics for WebGPURenderer, including its actual WebGL 2 fallback.
 * Ordinary documents import no browser tools, retain no renderer and start no timers. */
export async function prepareNodeDebug(config: EditionDebugConfig): Promise<NodeDebugSession | undefined> {
  const options = editionDebugOptions()
  if (!options.perf && !options.capture) return
  const { createNodeDebug } = await import('./debug-nodes-runtime.ts')
  return createNodeDebug(config, options)
}
