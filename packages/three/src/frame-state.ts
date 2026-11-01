/** Read the renderer without exposing Fiber's version-specific state key.
 * Generic so legacy WebGL and explicitly owned node renderers retain their type. */
export function frameRenderer<Renderer>(state: { readonly renderer?: Renderer | null; readonly gl?: Renderer | null }): NonNullable<Renderer> {
  const renderer = state.renderer ?? state.gl
  if (renderer == null) throw Error('The frame has no renderer')
  return renderer
}
/** Read elapsed frame seconds; never advance a clock or create a second timer.
 * Preserves the canvas clock origin used by mounted layers on Fiber 9. */
export function frameElapsed(state: { readonly elapsed?: number; readonly clock?: { readonly elapsedTime: number } }): number {
  const elapsed = state.elapsed ?? state.clock?.elapsedTime
  if (typeof elapsed !== 'number' || !Number.isFinite(elapsed)) throw Error('The frame has no finite elapsed time')
  return elapsed
}
