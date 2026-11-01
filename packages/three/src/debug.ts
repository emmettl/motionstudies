import type { WebGLRenderer } from 'three'

export interface EditionDebugOptions { perf: boolean; capture: boolean; continuous: boolean }
export function editionDebugOptions(search = typeof location === 'undefined' ? '' : location.search): EditionDebugOptions {
  const query = new URLSearchParams(search), modes = (query.get('debug') ?? '').split(',')
  const perf = modes.includes('perf'), capture = modes.includes('capture')
  return { perf, capture, continuous: perf && query.get('debugLoop') === 'continuous' }
}
export interface EditionDebugConfig {
  edition: string
  build: string
  metadata?: () => Record<string, unknown>
}
export interface DebugRendererOptions {
  label: string
  redraw: () => void
  metadata?: () => Record<string, unknown>
  supportsContinuous?: boolean
}
export interface DebugRenderer extends DebugRendererOptions { renderer: WebGLRenderer }
/** Active renderer references exist only in an explicitly enabled debug document. */
export const debugRenderers = new Map<WebGLRenderer, DebugRenderer>()
export function registerDebugRenderer(renderer: WebGLRenderer, options: DebugRendererOptions) {
  if (!editionDebugOptions().perf && !editionDebugOptions().capture) return () => {}
  debugRenderers.set(renderer, { renderer, ...options })
  window.dispatchEvent(new Event('motionstudies:debug-renderers'))
  return () => { debugRenderers.delete(renderer); window.dispatchEvent(new Event('motionstudies:debug-renderers')) }
}
/** Call before mounting the edition. Heavy tools are loaded only by explicit URL opt-in. */
export async function startEditionDebug(config: EditionDebugConfig) {
  const options = editionDebugOptions()
  if (!options.perf && !options.capture) return
  const { mountEditionDebug } = await import('./debug-runtime.ts')
  return mountEditionDebug(config, options)
}
