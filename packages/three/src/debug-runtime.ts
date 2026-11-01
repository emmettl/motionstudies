import { debugRenderers, type DebugRenderer, type EditionDebugConfig, type EditionDebugOptions } from './debug.ts'
import type { ICapture, Spector } from 'spectorjs'

/** Loaded only after explicit URL opt-in; deliberately independent of edition CSS/React. */
export async function mountEditionDebug(config: EditionDebugConfig, options: EditionDebugOptions) {
  const spector: Spector | undefined = options.capture ? new (await import('spectorjs')).Spector() : undefined
  spector?.spyCanvases()
  const host = document.createElement('aside')
  host.dataset.motionDebug = ''; host.setAttribute('aria-label', 'Edition GPU debugging')
  // Shadow DOM isolates edition styles and Spector's global styles from our controls.
  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = `<style>:host{position:fixed;right:12px;bottom:12px;z-index:2147483000;max-width:calc(100vw - 24px);color:#f4f5f8;font:13px/1.5 system-ui}details{background:#181c25;border:1px solid #697487;border-radius:6px;padding:10px;width:350px;max-width:calc(100vw - 48px);box-sizing:border-box}summary{cursor:pointer;font-weight:600}button,select,a{font:inherit;margin:4px 6px 4px 0}button,select{max-width:100%}a{color:#9ac8ff}pre{max-height:160px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere}p{margin:8px 0}output{display:block}</style>
  <details open><summary>Edition GPU debugging</summary><p data-heading></p><p>Instrumented session. Reload without debugging for baseline measurements.</p><p data-policy></p><label>Renderer <select aria-label="Debug renderer"></select></label><div data-actions></div><output role="status">Waiting for a renderer.</output><details><summary>Renderer observations</summary><pre></pre></details><div data-links></div></details>`
  document.body.append(host)
  const select = shadow.querySelector('select')!, status = shadow.querySelector('output')!, report = shadow.querySelector('pre')!, actions = shadow.querySelector<HTMLElement>('[data-actions]')!, links = shadow.querySelector<HTMLElement>('[data-links]')!
  shadow.querySelector('[data-heading]')!.textContent = `${config.edition} · ${config.build}`
  shadow.querySelector('[data-policy]')!.textContent = options.continuous ? 'Continuous profiling requested for Fiber canvases. Raw renderers keep their natural policy.' : 'Natural rendering policy preserved. Demand-rendered scenes update stats only when they draw.'
  const addLink = (text: string, query: URLSearchParams) => { const link = document.createElement('a'); link.textContent = text; link.href = `${location.pathname}?${query}${location.hash}`; links.append(link); return link }
  const query = new URLSearchParams(location.search)
  if (!options.capture) { const next = new URLSearchParams(query); next.set('debug', options.perf ? 'perf,capture' : 'capture'); addLink('Enable frame capture (reload)', next) }
  if (!options.perf) { const next = new URLSearchParams(query); next.set('debug', options.capture ? 'perf,capture' : 'perf'); addLink('Enable Fiber profiler (reload)', next) }
  if (options.perf) { const next = new URLSearchParams(query); if (options.continuous) next.delete('debugLoop'); else next.set('debugLoop', 'continuous'); addLink(options.continuous ? 'Natural rendering (reload)' : 'Continuous Fiber profiling (reload)', next) }
  const exit = new URLSearchParams(query); exit.delete('debug'); exit.delete('debugLoop'); addLink('Exit debugging (reload)', exit)
  let active: DebugRenderer[] = [], busy = false, capture: ICapture | undefined, blob: string | undefined, viewerReady = false, inspected: ICapture | undefined, captureMetadata: Record<string, unknown> | undefined
  const button = (text: string, click: () => void) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.onclick = click; actions.append(b); return b }
  const inspect = button('Inspect capture', () => { if (!spector || !capture) return; if (!viewerReady) { spector.displayUI(true); viewerReady = true } if (inspected !== capture) { spector.getResultUI().addCapture(capture); inspected = capture } spector.getResultUI().display() })
  inspect.disabled = true
  const download = document.createElement('a'); download.textContent = 'Download capture JSON'; download.download = `${config.edition}-webgl-capture.json`; download.hidden = true; actions.append(download)
  const snapshot = (target: DebugRenderer) => {
    const { renderer } = target, size = renderer.domElement
    return { label: target.label, ...config.metadata?.(), ...target.metadata?.(), drawingBuffer: { width: size.width, height: size.height, pixelRatio: renderer.getPixelRatio() }, renderer: { frames: renderer.info.render.frame, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }, contextLost: renderer.getContext().isContextLost() }
  }
  const captureButton = button('Capture WebGL frame', () => {
    const target = active[Number(select.value)]
    if (!spector || !target || busy) return
    captureMetadata = { edition: config.edition, build: config.build, url: location.href, requestedAt: new Date().toISOString(), options, ...snapshot(target) }
    busy = true; capture = undefined; inspect.disabled = true; download.hidden = true; captureButton.disabled = true; select.disabled = true; status.textContent = 'Capturing next frame…'
    try { spector.captureCanvas(target.renderer.domElement); requestAnimationFrame(() => { if (debugRenderers.has(target.renderer)) target.redraw() }) }
    catch (error) { fail(String(error)) }
  })
  captureButton.hidden = !spector
  const refresh = () => {
    const chosen = active[Number(select.value)]?.renderer
    active = [...debugRenderers.values()]
    select.replaceChildren(...active.map((target, i) => { const option = document.createElement('option'); option.value = String(i); option.textContent = target.label; return option }))
    const index = active.findIndex(target => target.renderer === chosen)
    select.value = String(Math.max(0, index)); select.disabled = busy || !active.length; captureButton.disabled = busy || !active.length
    if (!active.length) status.textContent = 'No registered WebGL renderer is mounted.'
    else if (!busy) status.textContent = 'Ready.'
  }
  const fail = (message: string) => { busy = false; status.textContent = `Capture failed: ${message}`; select.disabled = !active.length; captureButton.disabled = !active.length }
  const captured = spector?.onCapture.add(result => {
    capture = result; busy = false
    if (blob) URL.revokeObjectURL(blob)
    blob = URL.createObjectURL(new Blob([JSON.stringify({ ...result, motionstudies: { ...captureMetadata, capturedAt: new Date().toISOString() } })], { type: 'application/json' }))
    download.href = blob; download.hidden = false; inspect.disabled = false; select.disabled = !active.length; captureButton.disabled = !active.length; status.textContent = `Captured ${result.commands.length} WebGL commands.`
  })
  const failed = spector?.onError.add(fail)
  window.addEventListener('motionstudies:debug-renderers', refresh)
  const timer = window.setInterval(() => { const target = active[Number(select.value)]; report.textContent = target ? JSON.stringify(snapshot(target), null, 2) : 'No renderer.' }, 500)
  refresh()
  return () => { window.removeEventListener('motionstudies:debug-renderers', refresh); clearInterval(timer); if (blob) URL.revokeObjectURL(blob); if (captured !== undefined) spector?.onCapture.remove(captured); if (failed !== undefined) spector?.onError.remove(failed); host.remove() }
}
