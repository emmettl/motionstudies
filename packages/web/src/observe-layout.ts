/** Measure once immediately, then coalesce resize notifications into animation frames.
 * Keep geometry and CSS policy in the caller. Dispose before removing its elements.
 */
export function observeLayout(elements: readonly Element[], measure: () => void): () => void {
  let frame: number | undefined
  let disposed = false
  const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => {
    if (disposed || frame !== undefined) return
    frame = requestAnimationFrame(() => {
      frame = undefined
      if (!disposed) measure()
    })
  })
  const dispose = () => {
    disposed = true
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
    observer?.disconnect()
  }
  try {
    elements.forEach(element => observer?.observe(element))
    measure()
  } catch (error) {
    dispose()
    throw error
  }
  return dispose
}
