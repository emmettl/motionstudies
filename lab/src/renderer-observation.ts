import type { WebGLRenderer } from 'three'

/** Used by lab probes only; retains no renderer reference after unmount. */
export function observeRenderer(renderer: WebGLRenderer) {
  window.dispatchEvent(new CustomEvent('lab:renderer', { detail: { renderer, active: true } }))
  return () => { window.dispatchEvent(new CustomEvent('lab:renderer', { detail: { renderer, active: false } })) }
}
