import { open, readdir, stat, writeFile, rename, rm } from 'node:fs/promises'
import { join, resolve, isAbsolute } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { readFeedRegistry } from '../packages/data/src/feed-observability.mjs'
import { readOperationalFile } from '../packages/data/src/operational-files.mjs'

const HOUR = 3600000
const readJson = async (path, limit) => JSON.parse(await readOperationalFile(path, limit))
/** Selection needs only a journal's header, which the recorder writes before its attempts; a national bus journal is ~140 MiB. */
async function journalHead(path) {
  const handle = await open(path, 'r')
  try {
    const { buffer, bytesRead } = await handle.read({ buffer: Buffer.alloc(65536), position: 0 })
    const text = buffer.toString('utf8', 0, bytesRead), cut = text.indexOf('\n  "attempts": [')
    if (cut >= 0) return JSON.parse(`${text.slice(0, cut).replace(/,\s*$/, '')}\n}`)
  } finally { await handle.close() }
  return readJson(path, 256 * 1024 * 1024)
}
const dayAt = (ms, zone) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms)
/** The UTC instant at which civil `date` ends in `zone`, including 23- and 25-hour days. */
export function civilDayEnd(date, zone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Expected a YYYY-MM-DD date')
  let low = Date.parse(`${date}T00:00:00Z`) - 14 * HOUR, high = low + 52 * HOUR
  if (dayAt(low, zone) > date || dayAt(high, zone) <= date) throw new Error('Civil day outside the search window')
  while (high - low > 1) { const mid = Math.floor((low + high) / 2); if (dayAt(mid, zone) <= date) low = mid; else high = mid }
  return high
}
const previousDay = (ms, zone) => new Date(Date.parse(`${dayAt(ms, zone)}T00:00:00Z`) - 24 * HOUR).toISOString().slice(0, 10)

/**
 * Select the day's evidence from what the recorder host has written, for `recorderEvidenceHealth` to verify. The
 * archive target is the journal whose planned end is nearest that civil day's boundary, within five minutes; a
 * day without such a journal is reported in `missing` rather than guessed. The publication target is the newest
 * release pointer for each configured operator; an older one reads as pending, then degraded, after its deadline.
 */
export async function planRecorderEvidence({ registry: registryValue, producerId, host, date, now = Date.now(), graceHours = 6, validHours = 30 }) {
  const registry = readFeedRegistry(registryValue)
  if (!isAbsolute(host?.dataRoot ?? '') || !Array.isArray(host.feeds)) throw new Error('Host configuration needs an absolute dataRoot and feeds')
  if (!Number.isFinite(graceHours) || graceHours < 0 || graceHours > 72 || !Number.isFinite(validHours) || validHours < graceHours) throw new Error('Invalid evidence deadlines')
  const feeds = [], missing = []
  let latest = 0
  for (const entry of registry.feeds.filter(f => f.producerId === producerId && f.state === 'active')) {
    const f = host.feeds.find(h => h.name === entry.producerFeed)
    if (!f) { missing.push({ feedId: entry.id, reason: 'not-configured' }); continue }
    const day = date ?? previousDay(now, f.timeZone), end = civilDayEnd(day, f.timeZone), deadline = end + graceHours * HOUR
    const output = { feedId: entry.id }
    if (entry.stages.some(s => s.id === 'archive')) {
      const store = join(host.dataRoot, f.name), journals = []
      let names = []
      try { names = (await readdir(join(store, 'collections'))).filter(n => /^[A-Za-z0-9-]{1,80}\.json$/.test(n)) } catch (e) { if (e.code !== 'ENOENT') throw e }
      for (const name of names) {
        // A journal that ends at this boundary was last written at or after it; skip older files unread.
        if ((await stat(join(store, 'collections', name))).mtimeMs < end - 5 * 60000) continue
        const j = await journalHead(join(store, 'collections', name))
        const planned = Date.parse(j.plannedEnd)
        // Collectors aim just before the boundary, but a start computed from a rounded duration can land a few ms after it.
        if (j.config?.source === entry.sourceId && Math.abs(planned - end) <= 5 * 60000) journals.push({ name, j, planned })
      }
      const chosen = journals.sort((a, b) => Math.abs(a.planned - end) - Math.abs(b.planned - end))[0]
      if (chosen) output.archive = { journalPath: join(store, 'collections', chosen.name), closeoutPath: join(store, 'closeout', `${chosen.j.id}.json`), expectedEnd: new Date(chosen.planned).toISOString(), deadlineAt: new Date(deadline).toISOString() }
      else missing.push({ feedId: entry.id, reason: 'no-journal-for-day', date: day })
    }
    if (entry.stages.some(s => s.id === 'publication') && host.analytics?.feed === f.name) {
      const month = join(host.analytics.root, day.slice(0, 7), 'quality-release-pointers'), operator = host.analytics.operators?.[0]
      let best = null
      try {
        for (const name of (await readdir(month)).filter(n => /^[a-f0-9]{64}\.json$/.test(n))) {
          const p = await readJson(join(month, name), 8192)
          if (p.kind === 'feed-quality-release-pointer' && p.operator === operator && (!best || p.to > best.p.to || p.to === best.p.to && p.observedAt > best.p.observedAt)) best = { name, p }
        }
      } catch (e) { if (e.code !== 'ENOENT') throw e }
      if (best) output.publication = { pointerPath: join(month, best.name), operator, expectedThrough: day, deadlineAt: new Date(deadline).toISOString() }
      else missing.push({ feedId: entry.id, reason: 'no-release-pointer', date: day })
    }
    if (output.archive || output.publication) { feeds.push(output); latest = Math.max(latest, deadline) }
  }
  if (!feeds.length) throw new Error('No evidence could be selected for this day')
  return { plan: { schemaVersion: 1, kind: 'recorder-evidence-plan', producerId, validUntil: new Date(latest + (validHours - graceHours) * HOUR).toISOString(), feeds }, missing }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { values: v } = parseArgs({ options: { registry: { type: 'string' }, producer: { type: 'string' }, 'host-config': { type: 'string' }, date: { type: 'string' }, out: { type: 'string' }, 'grace-hours': { type: 'string', default: '6' } } })
    if (!v.registry || !v.producer || !v['host-config'] || !v.out) throw new Error('Provide --registry FILE --producer ID --host-config HOST_JSON --out PLAN_JSON [--date YYYY-MM-DD]')
    const { plan, missing } = await planRecorderEvidence({ registry: await readJson(v.registry, 256 * 1024), producerId: v.producer, host: await readJson(v['host-config'], 256 * 1024), date: v.date, graceHours: Number(v['grace-hours']) })
    const out = resolve(v.out), temporary = `${out}.${randomUUID()}.partial`
    try { await writeFile(temporary, `${JSON.stringify(plan, null, 2)}\n`); await rename(temporary, out) } finally { await rm(temporary, { force: true }) }
    // Paths are the host's own; report only feed identities and reasons.
    process.stdout.write(`${JSON.stringify({ feeds: plan.feeds.map(f => ({ feedId: f.feedId, archive: !!f.archive, publication: !!f.publication })), validUntil: plan.validUntil, missing }, null, 2)}\n`)
    process.exitCode = missing.length ? 2 : 0
  } catch (e) { process.stderr.write(`Evidence plan failed: ${e.message}\n`); process.exitCode = 1 }
}
