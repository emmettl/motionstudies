import { lazy, Suspense } from 'react'
import { perfEnabled } from './renderer-observation.ts'

const Perf = lazy(() => import('r3f-perf').then(module => ({ default: module.Perf })))
/** Profiling is selected on a fresh document; disabling also removes GL instrumentation. */
export function DiagnosticPerf() {
  return perfEnabled
    ? <Suspense fallback={null}><Perf position="top-left" className="lab-perf-overlay" style={{ position: 'absolute', maxWidth: '100%', overflow: 'auto' }} /></Suspense> : null
}
