import type { WebGLRenderer } from 'three'

export type DiagnosticRenderer = { renderer: WebGLRenderer; requestFrame?: () => void }
// Only the explicitly enabled diagnostics tab retains active renderers.
export const diagnosticRenderers = new Map<WebGLRenderer, DiagnosticRenderer>()
export const diagnosticsEnabled = new URLSearchParams(location.search).get('diagnostics') === '1'
export const perfEnabled = diagnosticsEnabled && new URLSearchParams(location.search).get('perf') === '1'
export function observeRenderer(renderer: WebGLRenderer, requestFrame?: () => void) {
  if (diagnosticsEnabled) {
    diagnosticRenderers.set(renderer, { renderer, requestFrame })
    window.dispatchEvent(new Event('lab:diagnostic-renderers'))
  }
  window.dispatchEvent(new CustomEvent('lab:renderer', { detail: { renderer, active: true } }))
  return () => {
    diagnosticRenderers.delete(renderer)
    if (diagnosticsEnabled) window.dispatchEvent(new Event('lab:diagnostic-renderers'))
    window.dispatchEvent(new CustomEvent('lab:renderer', { detail: { renderer, active: false } }))
  }
}
