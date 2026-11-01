import { currentSearch } from './url-store.ts'
import { useCallback, useEffect, useRef, useState } from 'react'
import { scenarioPatch, scenarios } from './scenarios.ts'
import { updateQuery, useSearch } from './scenario-state.tsx'
import { measurementInterval, type ValidationMetrics } from './validation-metrics.ts'
import { findStudy } from './studies.ts'

const bounded = (raw: string | null, fallback: number, min: number, max: number) => raw !== null && Number.isFinite(+raw) ? Math.max(min, Math.min(max, +raw)) : fallback
export function ValidationHarness({ studyId }: { studyId: string }) {
  const search = useSearch(), params = new URLSearchParams(search), study = findStudy(studyId)
  const width = bounded(params.get('width'), 760, 240, 1600), height = bounded(params.get('height'), 720, 280, 1400)
  const profile = params.get('host') ?? 'bare', textSize = params.get('text') === '200' ? 200 : 100
  const instances = params.get('instances') === '2' ? 2 : 1
  const [source] = useState(() => `./host.html${location.search}`)
  const frame = useRef<HTMLIFrameElement>(null), latest = useRef<ValidationMetrics | null>(null), alive = useRef(true)
  const [ready, setReady] = useState(false), [metrics, setMetrics] = useState<ValidationMetrics | null>(null)
  const [mounted, setMounted] = useState(params.get('mounted') !== '0'), [visible, setVisible] = useState(params.get('visible') !== '0'), [running, setRunning] = useState(false), [cycle, setCycle] = useState(0)
  const [sample, setSample] = useState<string>(), [measuring, setMeasuring] = useState(false)
  const send = useCallback((action: string, value?: unknown) => frame.current?.contentWindow?.postMessage({ type: 'lab:command', action, value }, location.origin), [])
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => {
    const listen = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== location.origin) return
      if (event.data?.type === 'lab:ready') setReady(true)
      if (event.data?.type === 'lab:metrics') { latest.current = event.data.metrics; setMetrics({ ...event.data.metrics, mounted: event.data.mounted }) }
      if (event.data?.type === 'lab:state' && typeof event.data.search === 'string') {
        const incoming = new URLSearchParams(event.data.search), patch: Record<string, string | null> = {}
        for (const key of new Set([...new URLSearchParams(currentSearch()).keys(), ...incoming.keys()])) if (/^v\d*\./.test(key)) patch[key] = incoming.get(key)
        updateQuery(patch)
      }
    }
    window.addEventListener('message', listen)
    return () => window.removeEventListener('message', listen)
  }, [])
  useEffect(() => { if (ready) { send('host', profile); send('text-size', textSize); send('instances', instances) } }, [ready, profile, textSize, instances, send])
  useEffect(() => { if (ready) send('state', search) }, [ready, search, send])
  const applyScenario = (id: string) => updateQuery(scenarioPatch(studyId, id, currentSearch()))
  const cycles = async () => {
    setRunning(true); setCycle(0)
    for (let i = 1; i <= 10 && alive.current; i++) {
      send('mount', false); await new Promise(resolve => setTimeout(resolve, 100))
      if (!alive.current) return
      send('mount', true); await new Promise(resolve => setTimeout(resolve, 150))
      if (alive.current) setCycle(i)
    }
    if (alive.current) { setMounted(true); updateQuery({ mounted: '1' }); setRunning(false) }
  }
  const measure = async () => {
    setMeasuring(true); send('reset-metrics')
    const seconds = await measurementInterval()
    if (!alive.current) return
    setSample(JSON.stringify({ study: studyId, scenario: params.get('scenario') ?? 'custom', seconds, width, height, profile, instances, dpr: devicePixelRatio, browser: navigator.userAgent, metrics: latest.current }, null, 2))
    setMeasuring(false)
  }
  return <>
    <fieldset className="toolbar validation-toolbar" disabled={running || measuring}><legend>Host configuration</legend>
      <label>Scenario <select value={params.get('scenario') ?? 'default'} onChange={e => applyScenario(e.target.value)}>{scenarios.filter(s => s.study === '*' || s.study === studyId).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label>Host <select value={profile} onChange={e => updateQuery({ host: e.target.value })}><option value="bare">Bare · documented styles</option><option value="light">Light background</option><option value="serif">Inherited large serif</option><option value="constrained">280 px container</option></select></label>
      <label>Host width <input type="number" min="240" max="1600" value={width} onChange={e => updateQuery({ width: e.target.value })} /></label>
      <label>Host height <input type="number" min="280" max="1400" value={height} onChange={e => updateQuery({ height: e.target.value })} /></label>
      <label><input type="checkbox" checked={instances === 2} onChange={e => updateQuery({ instances: e.target.checked ? '2' : '1' })} /> Two independent instances</label>
      <label><input type="checkbox" checked={textSize === 200} onChange={e => updateQuery({ text: e.target.checked ? '200' : '100' })} /> 200% base text</label>
    </fieldset>
    <div className="toolbar">
      <button disabled={!ready || running || measuring} onClick={() => { send('mount', !mounted); setMounted(!mounted); updateQuery({ mounted: mounted ? '0' : '1' }) }}>{mounted ? 'Unmount specimen' : 'Mount specimen'}</button>
      <button disabled={!ready || running || measuring} onClick={() => { send('visible', !visible); setVisible(!visible); updateQuery({ visible: visible ? '0' : '1' }) }}>{visible ? 'Hide specimen' : 'Show specimen'}</button>
      <button disabled={!ready || running || measuring} onClick={() => send('remount')}>Replace instance</button>
      <button disabled={!ready || running || measuring} onClick={() => void cycles()}>Cycle mount ×10</button>
      <output aria-live="polite" data-testid="cycle-status">{running ? `Cycling ${cycle}/10` : `${cycle} cycles completed`}</output>
      <a href={`./host.html${search}`} target="_blank" rel="noreferrer">Open bare specimen</a>
      <a href={`${location.pathname}${search}`}>Reproduction link</a>
      <a href={`./host.html${search}${search ? '&' : '?'}diagnostics=1`} target="_blank" rel="noreferrer">Open GPU diagnostics</a>
    </div>
    <details className="validation-contract" open><summary>Expected behavior</summary><ul>{study.expectations.map(text => <li key={text}>{text}</li>)}</ul><p>Checks exercise these expectations; controls expose additional manual inspection states.</p></details>
    <div className="validation-frame-scroll"><iframe ref={frame} src={source} title={`${study.label} validation host`} width={width} height={height} /></div>
    <details className="validation-metrics" open><summary>Lifecycle observations</summary>
      <p>Iframe stays alive during mount cycles. Counts include framework work; compare settled baselines. A flat timer count alone does not prove cleanup.</p>
      <pre data-testid="validation-metrics">{JSON.stringify(metrics, null, 2)}</pre>
      <button disabled={!ready || measuring || running} onClick={() => void measure()}>{measuring ? 'Measuring…' : 'Measure 5 seconds'}</button>
      <p>Use a paused named scenario and fixed dimensions for idle comparisons. Render commits, callback counts and pending work are measured; GPU allocation retention and browser memory are not inferred from these counts. Long-task observations are unavailable on some engines.</p>
      {sample && <><pre data-testid="performance-sample">{sample}</pre><a download={`lab-${studyId}-sample.json`} href={`data:application/json;charset=utf-8,${encodeURIComponent(sample)}`}>Download sample</a></>}
    </details>
  </>
}
