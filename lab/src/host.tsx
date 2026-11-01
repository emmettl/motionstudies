import { currentSearch } from './url-store.ts'
import { StudyView } from './StudyView.tsx'
import { Component, Profiler, StrictMode, useEffect, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { ButtonTooltips } from '@motionstudies/web/components/ButtonTooltips'
import '@motionstudies/web/fonts.css'
import '@motionstudies/web/tokens.css'
import '@motionstudies/web/mobile-picker.css'
import { seedScenario } from './scenarios.ts'
import { findStudy } from './studies.ts'
import { InstanceContext, updateQuery } from './scenario-state.tsx'
import { installValidationMetrics } from './validation-metrics.ts'
import './host.css'

const audit = installValidationMetrics()
const params = new URLSearchParams(location.search), study = findStudy(params.get('study'))
seedScenario(study.id)
const send = (type: string, data: object) => { if (parent !== window) parent.postMessage({ type, ...data }, location.origin) }
class Boundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(error: Error) { return { error: error.message } }
  render() { return this.state.error ? <p role="alert">Specimen failed: {this.state.error}</p> : this.props.children }
}
export function Host() {
  const [mounted, setMounted] = useState(params.get('mounted') !== '0'), [visible, setVisible] = useState(params.get('visible') !== '0'), [instances, setInstances] = useState(params.get('instances') === '2' ? 2 : 1), [generation, setGeneration] = useState(0)
  useEffect(() => {
    const handle = (event: MessageEvent) => {
      if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'lab:command') return
      const { action, value } = event.data
      if (action === 'mount') setMounted(Boolean(value))
      if (action === 'visible') setVisible(Boolean(value))
      if (action === 'instances') setInstances(value === 2 ? 2 : 1)
      if (action === 'remount') setGeneration(n => n + 1)
      if (action === 'reset-metrics') audit.reset()
      if (action === 'host' && ['bare', 'light', 'serif', 'constrained'].includes(value)) document.documentElement.dataset.host = value
      if (action === 'text-size') document.documentElement.style.fontSize = value === 200 ? '200%' : '100%'
      if (action === 'state' && typeof value === 'string') {
        const incoming = new URLSearchParams(value), patch: Record<string, string | null> = {}
        for (const key of new Set([...new URLSearchParams(currentSearch()).keys(), ...incoming.keys()])) if (/^v\d*\./.test(key)) patch[key] = incoming.get(key)
        updateQuery(patch)
      }
    }
    window.addEventListener('message', handle)
    const timer = audit.schedule(() => send('lab:metrics', { metrics: audit.snapshot(), mounted, visible, instances, generation }), 250)
    send('lab:ready', { study: study.id })
    return () => { window.removeEventListener('message', handle); clearInterval(timer) }
  }, [mounted, visible, instances, generation])
  return <main aria-label={`${study.label} isolated specimen`} hidden={!visible}>
    {mounted && Array.from({ length: instances }, (_, i) => <section key={`${generation}:${i}`} aria-label={`Instance ${i + 1}`}>
      <h1 className="host-title">{study.label} · instance {i + 1}</h1>
      <Boundary><InstanceContext value={i}><Profiler id={`instance-${i}`} onRender={audit.commit}><StudyView id={study.id} /></Profiler></InstanceContext></Boundary>
    </section>)}
    <ButtonTooltips />
  </main>
}
document.documentElement.dataset.host = params.get('host') ?? 'bare'
document.documentElement.style.fontSize = params.get('text') === '200' ? '200%' : '100%'
createRoot(document.getElementById('root')!).render(<StrictMode><Host /></StrictMode>)
