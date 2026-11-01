import { useEffect, useRef, useState } from 'react'
import { Spector, type ICapture } from 'spectorjs'
import { diagnosticRenderers } from './renderer-observation.ts'
import { currentSearch } from './url-store.ts'

// This module is only imported by an explicitly enabled, fresh diagnostic document.
// Spy before any specimen creates its context so captures include resource uploads.
const spector = new Spector()
spector.spyCanvases()

export function GpuDiagnostics() {
  const [renderers, setRenderers] = useState(() => [...diagnosticRenderers.values()])
  const [selected, setSelected] = useState(0), [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Ready to capture a frame.'), [download, setDownload] = useState<string>()
  const [capture, setCapture] = useState<ICapture>()
  const lastInspected = useRef<ICapture | undefined>(undefined), viewerMounted = useRef(false)
  useEffect(() => {
    let objectURL: string | undefined
    const changed = () => { setRenderers([...diagnosticRenderers.values()]); setSelected(0) }
    const captured = spector.onCapture.add(result => {
      setCapture(result)
      if (objectURL) URL.revokeObjectURL(objectURL)
      objectURL = URL.createObjectURL(new Blob([JSON.stringify({ ...result, lab: { url: `${location.origin}${location.pathname}${currentSearch()}`, capturedAt: new Date().toISOString() } })], { type: 'application/json' }))
      setDownload(objectURL)
      setBusy(false); setStatus(`Captured ${result.commands.length} WebGL commands.`)
    })
    const failed = spector.onError.add(message => { setBusy(false); setStatus(`Capture failed: ${message}`) })
    window.addEventListener('lab:diagnostic-renderers', changed)
    changed()
    return () => { if (objectURL) URL.revokeObjectURL(objectURL); window.removeEventListener('lab:diagnostic-renderers', changed); spector.onCapture.remove(captured); spector.onError.remove(failed) }
  }, [])
  const link = (enabled: boolean, perf: boolean) => {
    const params = new URLSearchParams(currentSearch())
    if (enabled) params.set('diagnostics', '1'); else params.delete('diagnostics')
    if (perf) { params.set('perf', '1'); params.set('instances', '1') } else params.delete('perf')
    return `${location.pathname}?${params}`
  }
  const startCapture = () => {
    const target = renderers[selected]
    if (!target || target.renderer.getContext().isContextLost()) { setStatus('Select a mounted renderer.'); return }
    setBusy(true); setCapture(undefined); setDownload(undefined); setStatus('Capturing next frame…')
    try {
      spector.captureCanvas(target.renderer.domElement)
      // Demand-rendered and raw Three specimens need an explicit frame to capture.
      requestAnimationFrame(() => target.requestFrame?.())
    } catch (error) { setBusy(false); setStatus(`Capture failed: ${String(error)}`) }
  }
  return <aside aria-label="GPU diagnostics" style={{ font: '14px/1.5 system-ui', border: '1px solid currentColor', padding: 12, marginBottom: 16 }}>
    <h2>GPU diagnostics</h2>
    <p>Instrumented session · use a fresh normal host for baseline measurements. Perf mode runs Terrain continuously and adds its own rendering work. GPU timings depend on browser support.</p>
    <p><a href={link(true, new URLSearchParams(location.search).get('perf') !== '1')}>{new URLSearchParams(location.search).get('perf') === '1' ? 'Disable' : 'Enable'} renderer statistics (reload)</a> · <a href={link(false, false)}>Exit diagnostics (reload)</a></p>
    <p>renderer statistics applies to Network and Terrain canvases. Spector also captures the raw Three weather canvas. Enabling the overlay opens one instance for reliable attribution.</p>
    <div className="toolbar">
      <label>Capture canvas <select disabled={busy || !renderers.length} value={selected} onChange={event => setSelected(Number(event.target.value))}>
        {renderers.map(({ renderer }, i) => <option key={i} value={i}>Canvas {i + 1} · {renderer.domElement.closest('section[aria-label]')?.getAttribute('aria-label') ?? 'specimen'}</option>)}
      </select></label>
      <button disabled={busy || !renderers.length} onClick={startCapture}>Capture WebGL frame</button>
      <button disabled={!capture} onClick={() => { if (capture) { if (!viewerMounted.current) { spector.displayUI(true); viewerMounted.current = true } if (lastInspected.current !== capture) { spector.getResultUI().addCapture(capture); lastInspected.current = capture } spector.getResultUI().display() } }}>Inspect capture</button>
      {download && <a download="lab-webgl-capture.json" href={download}>Download capture JSON</a>}
    </div>
    <output role="status" data-testid="gpu-capture-status">{renderers.length ? status : 'No observed WebGL renderer is mounted.'}</output>
  </aside>
}
