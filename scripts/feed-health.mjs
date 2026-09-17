import { parseArgs } from 'node:util'
import { recorderFeedHealth } from '../packages/data/src/recorder-observability.mjs'
import { recorderEvidenceHealth } from '../packages/data/src/recorder-evidence.mjs'
import { updateIncidentStore } from '../packages/data/src/feed-incidents.mjs'
import { readOperationalFile } from '../packages/data/src/operational-files.mjs'

async function readJson(path, limit) {
  return JSON.parse(await readOperationalFile(path, limit))
}

try {
  const { values: v } = parseArgs({ options: { registry: { type: 'string' }, status: { type: 'string' }, producer: { type: 'string' }, evidence: { type: 'string' }, incidents: { type: 'string' } } })
  if (!v.registry || !v.status || !v.producer) throw new Error('Provide --registry FILE --status FILE --producer ID')
  const registry = await readJson(v.registry, 256 * 1024)
  let status
  try { status = await readJson(v.status, 4 * 1024 * 1024) } catch (error) {
    if (error.code !== 'ENOENT') throw error
    status = null
  }
  let report = recorderFeedHealth(registry, status, { producerId: v.producer })
  if (v.evidence) report = await recorderEvidenceHealth(registry, report, await readJson(v.evidence, 256 * 1024))
  if (v.incidents) await updateIncidentStore(v.incidents, registry, report)
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  // No alerts for explicitly paused/setup feeds. Unknown active stages need attention.
  process.exitCode = report.telemetry.state !== 'current' || report.capacity.state !== 'healthy' || report.feeds.some(f => f.configuredState === 'active' && ['degraded', 'unknown'].includes(f.state)) ? 2 : 0
} catch {
  // Parser and filesystem errors may include private payloads, paths or credentials.
  process.stderr.write('Feed health failed: verify arguments, bounded JSON inputs, and incident store integrity, lock and capacity.\n')
  process.exitCode = 1
}
