import { it, expect, afterEach } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm, utimes } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { exporterEvidencePlan } from './exporter-evidence.mjs'

const dirs = []
afterEach(async () => { await Promise.all(dirs.splice(0).map(d => rm(d, { recursive: true, force: true }))) })
const now = Date.parse('2026-09-19T12:00:00Z')
async function host() {
  const root = await mkdtemp(join(tmpdir(), 'exporter-evidence-')); dirs.push(root)
  const hostConfig = join(root, 'host.json'), dataRoot = join(root, 'recordings')
  await writeFile(hostConfig, JSON.stringify({ dataRoot, feeds: [{ name: 'bus-day', timeZone: 'Europe/London' }, { name: 'day-swiss-edge', timeZone: 'Europe/Zurich' }], analytics: { feed: 'bus-day', root: join(root, 'analytics'), operators: ['FBRI'] } }))
  const journal = async (feed, id, source, plannedEnd) => {
    const dir = join(dataRoot, feed, 'collections'); await mkdir(dir, { recursive: true })
    const path = join(dir, `${id}.json`); await writeFile(path, JSON.stringify({ id, config: { source }, plannedEnd, status: 'complete', attempts: [] }, null, 2))
    const at = new Date(Date.parse(plannedEnd) + 1000); await utimes(path, at, at)
  }
  return { root, hostConfig, journal }
}
const base = { registry: resolve('config/feeds/recorder.production.json'), producer: 'recorder-minimax' }

it('adds each feed\'s archive target beside the deadline-driven publication target', async () => {
  const h = await host()
  await h.journal('bus-day', 'bus', 'bulk-archive', '2026-09-18T23:00:00.064Z')
  await h.journal('day-swiss-edge', 'swiss', 'swiss-edge', '2026-09-18T21:59:59.933Z')
  const publication = { feedId: 'uk-bus-archive', operator: 'FBRI', from: '2026-09-15', root: join(h.root, 'analytics'), timeZone: 'Europe/London', deadline: '06:00' }
  const plan = await exporterEvidencePlan({ ...base, publication, archive: { hostConfig: h.hostConfig } }, { now })
  const bus = plan.feeds.find(f => f.feedId === 'uk-bus-archive'), swiss = plan.feeds.find(f => f.feedId === 'swiss-realtime')
  expect(bus.publication).toMatchObject({ operator: 'FBRI', expectedThrough: '2026-09-18' })
  expect(bus.archive).toMatchObject({ expectedEnd: '2026-09-18T23:00:00.064Z', deadlineAt: '2026-09-19T05:00:00.000Z' })
  expect(swiss.archive.expectedEnd).toBe('2026-09-18T21:59:59.933Z')
  expect(plan.feeds.map(f => f.feedId).sort()).toEqual(['swiss-realtime', 'uk-bus-archive'])
  for (const f of plan.feeds) for (const t of [f.archive, f.publication].filter(Boolean)) expect(Date.parse(t.deadlineAt)).toBeLessThanOrEqual(Date.parse(plan.validUntil))
})

it('keeps the publication plan when no archive day can be selected, and returns nothing when neither is configured', async () => {
  const h = await host()
  const publication = { feedId: 'uk-bus-archive', operator: 'FBRI', from: '2026-09-15', root: join(h.root, 'analytics'), timeZone: 'Europe/London', deadline: '06:00' }
  const plan = await exporterEvidencePlan({ ...base, publication, archive: { hostConfig: h.hostConfig } }, { now })
  expect(plan.feeds).toHaveLength(1); expect(plan.feeds[0].archive).toBeUndefined()
  expect(await exporterEvidencePlan(base, { now })).toBeNull()
  await expect(exporterEvidencePlan({ ...base, archive: { hostConfig: 'relative.json' } }, { now })).rejects.toThrow(/Absolute/)
})
