import type { WebGLRenderer } from 'three'
export interface RendererLifetime { id: number; active: boolean; contextLost: boolean }
export interface ValidationMetrics {
  rendererLifetimes: RendererLifetime[]; mounted?: boolean; commits: number | null; callbacks: Record<string, number>; requests: number; aborted: number; failures: number
  pendingRequests: number; timeouts: number; intervals: number; animationFrames: number; frames: number
  longTasks: number | null; errors: string[]; renderers: { width: number; height: number; pixelRatio: number; frames: number; framesSinceReset: number; geometries: number; textures: number }[]
}

/** Host-only instrumentation. Counts include framework work; compare settled baselines, not absolute zero. */
export function installValidationMetrics() {
  const metrics: ValidationMetrics = { commits: import.meta.env.DEV ? 0 : null, callbacks: {}, requests: 0, aborted: 0, failures: 0, pendingRequests: 0, timeouts: 0, intervals: 0, animationFrames: 0, frames: 0, longTasks: null, errors: [], renderers: [], rendererLifetimes: [] }
  const renderers = new Set<WebGLRenderer>(), frameBaselines = new Map<WebGLRenderer, number>()
  const lifetimes = new WeakMap<WebGLRenderer, RendererLifetime>()
  let nextRendererId = 0
  window.addEventListener('lab:renderer', event => {
    const { renderer, active } = (event as CustomEvent<{ renderer: WebGLRenderer; active: boolean }>).detail
    let record = lifetimes.get(renderer)
    if (!record) {
      record = { id: ++nextRendererId, active: true, contextLost: false }
      lifetimes.set(renderer, record)
      metrics.rendererLifetimes.push(record)
      if (metrics.rendererLifetimes.length > 32) metrics.rendererLifetimes.shift()
      const lifetime = record
      renderer.domElement.addEventListener('webglcontextlost', () => {
        lifetime.contextLost = true
        if (lifetime.active) metrics.errors.push(`Renderer ${lifetime.id} lost its context while mounted`)
      })
    }
    record.active = active
    if (active) { renderers.add(renderer); frameBaselines.set(renderer, renderer.info.render.frame) } else { renderers.delete(renderer); frameBaselines.delete(renderer) }
  })
  const pendingTimeouts = new Set<number>(), pendingIntervals = new Set<number>(), pendingFrames = new Set<number>()
  const originalTimeout = window.setTimeout.bind(window), originalClearTimeout = window.clearTimeout.bind(window)
  const originalInterval = window.setInterval.bind(window), originalClearInterval = window.clearInterval.bind(window)
  const originalFrame = window.requestAnimationFrame.bind(window), originalCancelFrame = window.cancelAnimationFrame.bind(window)
  window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
    if (typeof handler !== 'function') return originalTimeout(handler, timeout, ...args)
    const id = originalTimeout(() => { pendingTimeouts.delete(id); if (typeof handler === 'function') handler.apply(window, args) }, timeout)
    pendingTimeouts.add(id); return id
  }) as typeof window.setTimeout
  window.clearTimeout = id => { pendingTimeouts.delete(Number(id)); pendingIntervals.delete(Number(id)); originalClearTimeout(id) }
  window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
    const id = originalInterval(handler, timeout, ...args); pendingIntervals.add(id); return id
  }) as typeof window.setInterval
  window.clearInterval = id => { pendingIntervals.delete(Number(id)); pendingTimeouts.delete(Number(id)); originalClearInterval(id) }
  window.requestAnimationFrame = callback => {
    const id = originalFrame(time => { pendingFrames.delete(id); metrics.frames++; callback(time) })
    pendingFrames.add(id); return id
  }
  window.cancelAnimationFrame = id => { pendingFrames.delete(id); originalCancelFrame(id) }
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (...args) => {
    metrics.requests++; metrics.pendingRequests++
    try { return await originalFetch(...args) }
    catch (error) { if (error instanceof DOMException && error.name === 'AbortError') metrics.aborted++; else metrics.failures++; throw error }
    finally { metrics.pendingRequests-- }
  }
  window.addEventListener('lab:callback', event => {
    const name = (event as CustomEvent<{ name: string }>).detail.name
    metrics.callbacks[name] = (metrics.callbacks[name] ?? 0) + 1
  })
  window.addEventListener('error', event => metrics.errors.push(event.message))
  window.addEventListener('unhandledrejection', event => metrics.errors.push(String(event.reason)))
  if (globalThis.PerformanceObserver?.supportedEntryTypes.includes('longtask')) {
    metrics.longTasks = 0
    new PerformanceObserver(list => { metrics.longTasks! += list.getEntries().length }).observe({ type: 'longtask' })
  }
  return {
    commit: () => { if (metrics.commits !== null) metrics.commits++ },
    snapshot: (): ValidationMetrics => ({ ...metrics, rendererLifetimes: metrics.rendererLifetimes.map(record => ({ ...record })), renderers: [...renderers].map(r => ({ width: r.domElement.width, height: r.domElement.height, pixelRatio: r.getPixelRatio(), frames: r.info.render.frame, framesSinceReset: r.info.render.frame - (frameBaselines.get(r) ?? 0), geometries: r.info.memory.geometries, textures: r.info.memory.textures })), callbacks: { ...metrics.callbacks }, errors: [...metrics.errors], timeouts: pendingTimeouts.size, intervals: pendingIntervals.size, animationFrames: pendingFrames.size }),
    schedule: originalInterval,
    reset: () => { for (const renderer of renderers) frameBaselines.set(renderer, renderer.info.render.frame); if (metrics.commits !== null) metrics.commits = 0; metrics.callbacks = {}; metrics.requests = 0; metrics.aborted = 0; metrics.failures = 0; metrics.frames = 0; if (metrics.longTasks !== null) metrics.longTasks = 0; metrics.errors = [] },
  }
}

export async function measurementInterval() {
  const started = performance.now()
  await new Promise(resolve => setTimeout(resolve, 5250))
  return +((performance.now() - started) / 1000).toFixed(2)
}
