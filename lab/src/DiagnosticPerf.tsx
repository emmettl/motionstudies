import { DebugPerformance } from '@motionstudies/three/debug-performance'
import { perfEnabled } from './renderer-observation.ts'

export function DiagnosticPerf() {
  return perfEnabled ? <DebugPerformance className="lab-perf-overlay" /> : null
}
