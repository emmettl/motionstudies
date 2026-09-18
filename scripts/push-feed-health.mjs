import { parseArgs } from 'node:util'
import { readOperationalFile } from '../packages/data/src/operational-files.mjs'
import { readFeedRegistry, readFeedHealth } from '../packages/data/src/feed-observability.mjs'

try {
  const { values: v } = parseArgs({ options: { registry: { type: 'string' }, report: { type: 'string' }, url: { type: 'string' } } })
  if (!v.registry || !v.report || !v.url) throw new Error('Missing arguments')
  const url = new URL(v.url), token = process.env.FEED_PUSH_TOKEN
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/api/feeds/v1/producer' || !token || token.length < 32 || token.length > 256) throw new Error('Invalid destination or token')
  const registry = readFeedRegistry(JSON.parse(await readOperationalFile(v.registry, 256 * 1024)))
  const report = readFeedHealth(JSON.parse(await readOperationalFile(v.report, 64 * 1024)), registry)
  const body = JSON.stringify(report)
  if (Buffer.byteLength(body) > 64 * 1024) throw new Error('Report limit')
  const response = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body, redirect: 'error', signal: AbortSignal.timeout(10000) })
  await response.body?.cancel()
  if (!response.ok) throw new Error('Push rejected')
  process.stdout.write('Feed health accepted by observer.\n')
} catch {
  process.stderr.write('Feed health push failed: check destination, credentials, report validity and observer availability.\n')
  process.exitCode = 1
}
