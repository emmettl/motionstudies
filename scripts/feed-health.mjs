import { open } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { recorderFeedHealth } from '../packages/data/src/recorder-observability.mjs'

async function readJson(path, limit) {
  const handle = await open(path, 'r')
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > limit) throw new Error('Input must be a bounded regular file')
    const bytes = Buffer.alloc(limit + 1)
    let size = 0
    while (size <= limit) {
      const { bytesRead } = await handle.read(bytes, size, bytes.length - size, null)
      if (!bytesRead) break
      size += bytesRead
    }
    if (size > limit) throw new Error('Input exceeds read limit')
    return JSON.parse(bytes.subarray(0, size).toString('utf8'))
  } finally { await handle.close() }
}

try {
  const { values: v } = parseArgs({ options: { registry: { type: 'string' }, status: { type: 'string' }, producer: { type: 'string' } } })
  if (!v.registry || !v.status || !v.producer) throw new Error('Provide --registry FILE --status FILE --producer ID')
  const registry = await readJson(v.registry, 256 * 1024)
  let status
  try { status = await readJson(v.status, 4 * 1024 * 1024) } catch (error) {
    if (error.code !== 'ENOENT') throw error
    status = null
  }
  const report = recorderFeedHealth(registry, status, { producerId: v.producer })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  // No alerts for explicitly paused/setup feeds. Unknown active stages need attention.
  process.exitCode = report.telemetry.state !== 'current' || report.capacity.state !== 'healthy' || report.feeds.some(f => f.configuredState === 'active' && ['degraded', 'unknown'].includes(f.state)) ? 2 : 0
} catch {
  // Parser and filesystem errors may include private payloads, paths or credentials.
  process.stderr.write('Feed health failed: verify arguments, registry, and bounded JSON status input.\n')
  process.exitCode = 1
}
