import type { EditionDebugConfig, EditionDebugOptions } from './debug.ts'
import type { NodeBuilder } from 'three/webgpu'
import type { ICapture, Spector } from 'spectorjs'
import type { NodeDebugRenderer, NodeDebugTarget } from './debug-nodes.ts'

// These public r186 fields are absent from @types/three's minimal NodeBuilder.
type ShaderBuilder = NodeBuilder & { vertexShader?: string | null; fragmentShader?: string | null; computeShader?: string | null }

/** Loaded only by opt-in. Backend diagnostics do not read GPU state or advance an application. */
export function createNodeDebug(config: EditionDebugConfig, options: EditionDebugOptions) {
  let renderer: NodeDebugRenderer, backend: 'webgpu' | 'webgl2', spector: Spector | undefined
  const builders = new Set<ShaderBuilder>(), errors: Record<string, unknown>[] = []
  let deviceLost = false, disposed = false, mounted = false, restore = () => {}, removePanel = () => {}
  const record = (kind: string, detail: unknown) => {
    errors.push({ kind, at: new Date().toISOString(), detail })
    if (errors.length > 32) errors.shift()
  }

  async function observe(value: NodeDebugRenderer) {
    if (disposed) throw new Error('This debug session is disposed')
    if (renderer) throw new Error('This debug session already observes a renderer')
    renderer = value
    backend = 'isWebGLBackend' in renderer.backend ? 'webgl2' : 'webgpu'
    // Attach to this actual context before the application creates GPU resources.
    // Spector is a WebGL tool; native WebGPU never imports it.
    if (options.capture && backend === 'webgl2') {
      spector = new (await import('spectorjs')).Spector()
      spector.spyCanvas(renderer.domElement)
    }
    const { onNodeBuilderCreated, onShaderError } = renderer.debug
    const { onError, onDeviceLost } = renderer
    const nodeHook: NonNullable<typeof onNodeBuilderCreated> = (builder, object) => {
      onNodeBuilderCreated?.(builder, object)
      if (builders.size < 64) builders.add(builder)
    }
    const shaderHook: NonNullable<typeof onShaderError> = (gl, program, vertex, fragment) => {
      record('shader', { program: gl.getProgramInfoLog(program), vertex: gl.getShaderInfoLog(vertex), fragment: gl.getShaderInfoLog(fragment) })
      if (onShaderError) onShaderError(gl, program, vertex, fragment)
      else console.error('Node shader compilation failed', errors.at(-1))
    }
    const errorHook: typeof onError = error => {
      // r186 passes an object at runtime although its declaration says string.
      // Keep the message, not the original browser event/device references.
      const detail: unknown = error
      record('backend', typeof detail === 'object' && detail !== null
        ? Object.fromEntries(['api', 'type', 'message'].map(key => [key, (detail as Record<string, unknown>)[key]]))
        : String(detail))
      onError.call(renderer, error)
    }
    const lostHook: typeof onDeviceLost = info => {
      deviceLost = true
      record('device-lost', { api: info.api, reason: info.reason, message: info.message })
      onDeviceLost.call(renderer, info)
    }
    renderer.debug.onNodeBuilderCreated = nodeHook
    renderer.debug.onShaderError = shaderHook
    renderer.onError = errorHook
    renderer.onDeviceLost = lostHook
    restore = () => {
      if (renderer.debug.onNodeBuilderCreated === nodeHook) renderer.debug.onNodeBuilderCreated = onNodeBuilderCreated
      if (renderer.debug.onShaderError === shaderHook) renderer.debug.onShaderError = onShaderError
      if (renderer.onError === errorHook) renderer.onError = onError
      if (renderer.onDeviceLost === lostHook) renderer.onDeviceLost = onDeviceLost
      builders.clear()
    }
  }

  function mount(target: NodeDebugTarget) {
    if (disposed || !renderer || mounted) throw new Error('Observe one initialized renderer before mounting its debug panel')
    mounted = true
    const host = document.createElement('aside')
    host.dataset.motionDebug = 'nodes'
    host.setAttribute('aria-label', 'Edition GPU debugging')
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = `<style>:host{position:fixed;right:12px;bottom:12px;z-index:2147483000;max-width:calc(100vw - 24px);color:#f4f5f8;font:13px/1.5 system-ui}details{background:#181c25;border:1px solid #697487;border-radius:6px;padding:10px;width:370px;max-width:calc(100vw - 48px);box-sizing:border-box}details[open]{max-height:calc(100dvh - 24px);overflow:auto}details details{width:auto;max-width:none}summary{cursor:pointer;font-weight:600}button,a{font:inherit;margin:4px 6px 4px 0}button{max-width:100%}a{color:#9ac8ff}pre{max-height:200px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere}p{margin:8px 0}output{display:block}</style>
      <details open><summary>Edition GPU debugging</summary><p data-heading></p><p>Instrumented session. Reload without debugging for baseline measurements. Natural rendering policy preserved.</p><p data-capability></p><div data-actions></div><output role="status">Ready.</output><details><summary>Renderer observations</summary><pre data-observations></pre></details><details><summary>Saved GPU report</summary><pre data-report>No report saved.</pre></details><details data-capture-details hidden><summary>Last frame capture</summary><pre data-capture></pre></details><div data-links></div></details>`
    document.body.append(host)
    const find = <T extends HTMLElement>(selector: string) => shadow.querySelector<T>(selector)!
    find('[data-heading]').textContent = `${config.edition} · ${config.build} · ${backend === 'webgpu' ? 'WebGPU' : 'WebGL 2'}`
    find('[data-capability]').textContent = backend === 'webgpu'
      ? 'WebGPU: renderer observations, GPU errors and generated WGSL. Native WebGPU command capture is unavailable here.'
      : 'WebGL 2 fallback: renderer observations, generated GLSL and Spector frame captures.'
    const status = find<HTMLOutputElement>('output'), actions = find('[data-actions]')
    const blobs = new Map<HTMLAnchorElement, string>()
    const link = (text: string, filename: string) => {
      const a = document.createElement('a'); a.textContent = text; a.download = filename; a.hidden = true; actions.append(a); return a
    }
    const save = (a: HTMLAnchorElement, payload: unknown) => {
      const previous = blobs.get(a); if (previous) URL.revokeObjectURL(previous)
      const blob = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
      blobs.set(a, blob); a.href = blob; a.hidden = false
    }
    const button = (text: string, click: () => void) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.onclick = click; actions.append(b); return b
    }
    const snapshot = () => ({
      ...config.metadata?.(), ...target.metadata?.(),
      edition: config.edition, build: config.build, backend, label: target.label, url: location.href,
      observedAt: new Date().toISOString(), options,
      drawingBuffer: { width: renderer.domElement.width, height: renderer.domElement.height, pixelRatio: renderer.getPixelRatio() },
      renderer: { frame: renderer.info.frame, render: { ...renderer.info.render }, compute: { ...renderer.info.compute }, memory: { ...renderer.info.memory } },
      contextLost: backend === 'webgl2' ? (renderer.getContext() as WebGL2RenderingContext).isContextLost() : deviceLost,
      errors: errors.slice(),
    })
    const shaders = () => [...builders].map(builder => ({
      material: builder.material?.name || builder.material?.type || 'Renderer output',
      language: backend === 'webgpu' ? 'wgsl' : 'glsl',
      vertex: builder.vertexShader, fragment: builder.fragmentShader, compute: builder.computeShader,
    })).filter(shader => shader.vertex || shader.fragment || shader.compute)
    const reportLink = link('Download GPU report', `${config.edition}-${backend}-report.json`)
    button('Save GPU report', () => {
      const report = { kind: 'renderer-diagnostics', commandCapture: false, motionstudies: snapshot(), shaders: shaders() }
      save(reportLink, report)
      find('[data-report]').textContent = JSON.stringify(report, null, 2)
      status.textContent = `Saved ${backend === 'webgpu' ? 'WebGPU' : 'WebGL 2'} report with ${report.shaders.length} shader programs. Scene unchanged.`
    })
    let capture: ICapture | undefined, inspected: ICapture | undefined, busy = false, viewerReady = false
    let captureMetadata: ReturnType<typeof snapshot>, captureTimer: number | undefined, redrawFrame: number | undefined
    const captureLink = link('Download capture JSON', `${config.edition}-webgl-capture.json`)
    const inspect = button('Inspect capture', () => {
      if (!spector || !capture) return
      if (!viewerReady) { spector.displayUI(true); viewerReady = true }
      if (inspected !== capture) { spector.getResultUI().addCapture(capture); inspected = capture }
      spector.getResultUI().display()
    })
    inspect.disabled = true; inspect.hidden = !spector
    const captureButton = button('Capture WebGL frame', () => {
      if (!spector || busy) return
      captureMetadata = snapshot(); busy = true; capture = undefined
      captureButton.disabled = true; inspect.disabled = true; captureLink.hidden = true
      status.textContent = 'Capturing next frame…'
      try {
        spector.captureCanvas(renderer.domElement)
        // Redraw only. Simulation passes remain owned by the application frame.
        redrawFrame = requestAnimationFrame(() => { if (!disposed) target.redraw() })
        captureTimer = window.setTimeout(() => {
          try { if (busy) { spector?.stopCapture(); if (busy) fail('No frame completed within 10 seconds.') } }
          catch (error) { fail(String(error)) }
        }, 10000)
      } catch (error) { fail(String(error)) }
    })
    captureButton.hidden = !options.capture
    captureButton.disabled = !spector
    const fail = (message: string) => {
      busy = false; window.clearTimeout(captureTimer); captureButton.disabled = !spector
      status.textContent = `Capture failed: ${message}`
    }
    const captured = spector?.onCapture.add(result => {
      if (disposed) return
      capture = result; busy = false; window.clearTimeout(captureTimer)
      save(captureLink, { ...result, motionstudies: { ...captureMetadata, capturedAt: new Date().toISOString() } })
      find('[data-capture-details]').hidden = false
      find('[data-capture]').textContent = JSON.stringify({
        commands: result.commands.length,
        draws: result.commands.filter(command => command.name.startsWith('draw')).length,
        offscreenFramebufferBindings: result.commands.filter(command => command.name === 'bindFramebuffer' && command.commandArguments[1] !== null).length,
        motionstudies: captureMetadata,
      }, null, 2)
      inspect.disabled = false; captureButton.disabled = false
      status.textContent = `Captured ${result.commands.length} WebGL commands.`
    })
    const failed = spector?.onError.add(fail)
    const addReload = (text: string, query: URLSearchParams) => {
      const a = document.createElement('a'); a.textContent = text; a.href = `${location.pathname}?${query}${location.hash}`; find('[data-links]').append(a)
    }
    if (!options.capture && backend === 'webgl2') {
      const query = new URLSearchParams(location.search); query.set('debug', 'perf,capture'); addReload('Enable frame capture (reload)', query)
    }
    const exit = new URLSearchParams(location.search); exit.delete('debug'); exit.delete('debugLoop'); addReload('Exit debugging (reload)', exit)
    const refresh = () => { find('[data-observations]').textContent = JSON.stringify(snapshot(), null, 2) }
    refresh(); const timer = window.setInterval(refresh, 500)
    removePanel = () => {
      disposed = true; clearInterval(timer); window.clearTimeout(captureTimer)
      if (redrawFrame !== undefined) cancelAnimationFrame(redrawFrame)
      if (captured !== undefined) spector?.onCapture.remove(captured)
      if (failed !== undefined) spector?.onError.remove(failed)
      if (busy) spector?.stopCapture()
      for (const blob of blobs.values()) URL.revokeObjectURL(blob)
      host.remove()
    }
  }
  return { observe, mount, dispose() { if (disposed) return; disposed = true; removePanel(); restore() } }
}
