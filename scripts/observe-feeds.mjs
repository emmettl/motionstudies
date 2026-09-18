import { parseArgs } from 'node:util'
import { observeFeeds } from '../packages/data/src/feed-observer.mjs'
import { readOperationalFile } from '../packages/data/src/operational-files.mjs'
import { updateIncidentStore } from '../packages/data/src/feed-incidents.mjs'

try {
  const { values: v } = parseArgs({ options: { registry: { type: 'string' }, config: { type: 'string' }, incidents: { type: 'string' } } })
  if (!v.registry || !v.config) throw new Error('Provide registry and observer config')
  const registry = JSON.parse(await readOperationalFile(v.registry, 256 * 1024))
  const config = JSON.parse(await readOperationalFile(v.config, 64 * 1024))
  // A credential is sent only to explicitly configured endpoints, never a redirect.
  const consumers = JSON.parse(process.env.FEED_CONSUMER_TOKENS_JSON ?? '{}')
  const checked = await observeFeeds(registry, config, { tokens: { health: process.env.FEED_HEALTH_TOKEN, consumers } })
  if (v.incidents) await updateIncidentStore(v.incidents, registry, checked.report)
  process.stdout.write(`${JSON.stringify(checked, null, 2)}\n`)
  const report = checked.report
  process.exitCode = report.telemetry.state !== 'current' || report.capacity.state !== 'healthy' || report.feeds.some(f => f.configuredState === 'active' && ['degraded', 'unknown'].includes(f.state)) || checked.consumers.some(c => c.state !== 'healthy') ? 2 : 0
} catch {
  process.stderr.write('Feed observer failed: check configuration, credentials and incident-store integrity/capacity.\n')
  process.exitCode = 1
}
