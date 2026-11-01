import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { auditHosts, auditPresentations } from '../lab/src/audit-cases.ts'
import { studies } from '../lab/src/studies.ts'

const directory = process.argv[2] ?? 'docs/evidence/lab-audit-2026-11-01'
const projects = ['desktop-chromium', 'desktop-webkit', 'iphone-webkit']
const caseIds = [...studies.map(s => s.id), ...auditPresentations.map(s => s.id)]
const expected = new Set(caseIds.flatMap(id => auditHosts.map(host => `${id}/${host.id}`)))
const read = async name => JSON.parse(await readFile(join(directory, name), 'utf8'))
const range = values => values.some(v => typeof v !== 'number') ? null : { min: Math.min(...values), max: Math.max(...values) }
const matrix = [], baselines = []
for (const project of projects) {
  const report = await read(`${project}.json`)
  const keys = new Set(report.cases.map(c => `${c.specimen}/${c.host}`))
  if (report.cases.length !== expected.size || keys.size !== expected.size || [...expected].some(key => !keys.has(key))) throw new Error(`Incomplete matrix for ${project}: expected ${expected.size} unique conditions`)
  const findings = report.cases.filter(c => c.errors.length || c.alerts.length || c.violations.length || c.layout.bodyOverflow || c.layout.outside.length)
  if (findings.length) throw new Error(`Unresolved audit findings for ${project}: ${findings.map(c => `${c.specimen}/${c.host}`).join(', ')}`)
  matrix.push({ project, browserVersion: report.browserVersion, mode: report.mode, conditions: report.cases.length, findings: 0 })
  const performance = await read(`performance-${project}.json`)
  if (performance.cases.length !== 3 || performance.cases.some(c => c.samples.length !== 3)) throw new Error(`Expected three repeated samples for each baseline in ${project}`)
  for (const row of performance.cases) {
    if (row.samples.some(s => s.metrics.requests || s.metrics.errors.length || Object.values(s.metrics.callbacks).some(n => n))) throw new Error(`Baseline was not idle: ${project}/${row.study}`)
    baselines.push({ project, study: row.study, scenario: row.scenario, mode: performance.mode, samples: row.samples.length,
      seconds: range(row.samples.map(s => s.seconds)), submittedFrames: range(row.samples.map(s => s.metrics.renderers.reduce((n, r) => n + r.framesSinceReset, 0))),
      geometries: range(row.samples.map(s => s.metrics.renderers.reduce((n, r) => n + r.geometries, 0))), textures: range(row.samples.map(s => s.metrics.renderers.reduce((n, r) => n + r.textures, 0))),
      commits: range(row.samples.map(s => s.metrics.commits)), longTasks: range(row.samples.map(s => s.metrics.longTasks)), requests: 0, consumerCallbacks: 0,
      buffers: [...new Set(row.samples.flatMap(s => s.metrics.renderers.map(({ width, height, pixelRatio }) => JSON.stringify({ width, height, pixelRatio }))))].map(value => JSON.parse(value)),
    })
  }
}
const paths = ['lab/src/audit-cases.ts', 'lab/src/studies.ts', 'lab/src/scenarios.ts', 'lab/src/validation-metrics.ts', 'lab/src/host.css', 'lab/src/panel-layout-study.css', 'lab/src/PowerDayStudy.tsx', 'lab/src/AirportStudy.tsx', 'lab/src/PowerWeatherStudy.tsx', 'lab/src/WeatherStudy.tsx', 'lab/public/data/airport-unavailable/api/airports/v1/gleislicht/capabilities', 'packages/web/src/components/airport-hero-card.css', 'lab/e2e/component-audit.spec.ts', 'lab/e2e/gpu-lifecycle.spec.ts', 'lab/e2e/performance-baseline.spec.ts', 'lab/e2e/airport-contrast.spec.ts', 'lab/e2e/audit-regressions.spec.ts']
const files = await Promise.all(paths.map(async path => ({ path, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })))
const summary = { date: '2026-11-01', source: { baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), files },
  protocol: { specimenPresentations: caseIds.length, hostConditions: auditHosts.length, projects: projects.length, baselineSamplesPerCase: 3, telemetryIntervalMs: 250, note: 'Submitted frames are cumulative renderer counters sampled over approximately 5.25 seconds. These observations are not FPS budgets or proof of physical GPU-memory reclamation. Production React commit counts are unavailable.' },
  conditions: matrix.reduce((n, r) => n + r.conditions, 0), matrix, baselines }
await writeFile(join(directory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
console.log(`${summary.conditions} host conditions; no unresolved runtime, containment or accessibility findings.`)
for (const row of baselines) console.log(`${row.project} ${row.study}: ${row.submittedFrames.min}–${row.submittedFrames.max} submitted frames; ${row.geometries.min}–${row.geometries.max} geometries; ${row.textures.min}–${row.textures.max} textures`)
