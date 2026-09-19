import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm, readFile, utimes } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { civilDayEnd, planRecorderEvidence } from './feed-evidence-plan.mjs'

const registry = JSON.parse(await readFile(new URL('../config/feeds/recorder.example.json', import.meta.url), 'utf8'))
const dirs = []
afterEach(async () => { await Promise.all(dirs.splice(0).map(d => rm(d, { recursive: true, force: true }))) })

async function host() {
  const root = await mkdtemp(join(tmpdir(), 'evidence-plan-')); dirs.push(root)
  const config = { dataRoot: join(root, 'recordings'), feeds: [{ name: 'bus-day', timeZone: 'Europe/London' }, { name: 'day-swiss-edge', timeZone: 'Europe/Zurich' }], analytics: { feed: 'bus-day', root: join(root, 'analytics'), operators: ['FBRI'] } }
  const journal = async (feed, id, source, plannedEnd, attempts = 3) => {
    const dir = join(config.dataRoot, feed, 'collections'); await mkdir(dir, { recursive: true })
    const value = { schemaVersion: 2, id, config: { source }, startedAt: '2026-09-17T23:00:00Z', plannedEnd, status: 'complete', attempts: Array.from({ length: attempts }, () => ({ status: 'captured', receivedAt: '2026-09-18T01:00:00Z', padding: 'x'.repeat(40000) })) }
    const path = join(dir, `${id}.json`); await writeFile(path, JSON.stringify(value, null, 2))
    const at = new Date(Date.parse(plannedEnd) + 1000); await utimes(path, at, at)
  }
  const pointer = async (name, to, observedAt) => {
    const dir = join(config.analytics.root, '2026-09', 'quality-release-pointers'); await mkdir(dir, { recursive: true })
    await writeFile(join(dir, `${name.repeat(64)}.json`), JSON.stringify({ schemaVersion: 1, kind: 'feed-quality-release-pointer', operator: 'FBRI', from: '2026-09-15', to, resultId: 'a'.repeat(64), observedAt }))
  }
  return { config, journal, pointer }
}

describe('recorder evidence plans', () => {
  it('finds civil day ends across daylight-saving changes', () => {
    expect(new Date(civilDayEnd('2026-09-18', 'Europe/London')).toISOString()).toBe('2026-09-18T23:00:00.000Z')
    expect(new Date(civilDayEnd('2026-09-18', 'Europe/Zurich')).toISOString()).toBe('2026-09-18T22:00:00.000Z')
    expect(new Date(civilDayEnd('2026-10-25', 'Europe/London')).toISOString()).toBe('2026-10-26T00:00:00.000Z')
    expect(new Date(civilDayEnd('2026-03-29', 'Europe/London')).toISOString()).toBe('2026-03-29T23:00:00.000Z')
  })

  it('selects the journal nearest each boundary and the newest release pointer', async () => {
    const h = await host()
    await h.journal('bus-day', 'previous', 'bulk-archive', '2026-09-17T22:59:59.474Z')
    // Large enough that the header must be read without the attempts.
    await h.journal('bus-day', 'day', 'bulk-archive', '2026-09-18T23:00:00.064Z', 200)
    await h.journal('bus-day', 'next', 'bulk-archive', '2026-09-19T22:59:59.474Z')
    await h.journal('day-swiss-edge', 'swiss', 'swiss-edge', '2026-09-18T21:59:59.933Z')
    await h.pointer('b', '2026-09-17', '2026-09-17T23:17:47Z'); await h.pointer('c', '2026-09-18', '2026-09-18T23:19:03Z')
    const { plan, missing } = await planRecorderEvidence({ registry, producerId: 'recorder-minimax', host: h.config, date: '2026-09-18' })
    const bus = plan.feeds.find(f => f.feedId === 'uk-bus-archive'), swiss = plan.feeds.find(f => f.feedId === 'swiss-realtime')
    expect(bus.archive).toMatchObject({ expectedEnd: '2026-09-18T23:00:00.064Z', deadlineAt: '2026-09-19T05:00:00.000Z' })
    expect(bus.archive.journalPath.endsWith('/bus-day/collections/day.json')).toBe(true)
    expect(bus.archive.closeoutPath.endsWith('/bus-day/closeout/day.json')).toBe(true)
    expect(bus.publication).toMatchObject({ operator: 'FBRI', expectedThrough: '2026-09-18' })
    expect(bus.publication.pointerPath.endsWith(`${'c'.repeat(64)}.json`)).toBe(true)
    expect(swiss.archive.expectedEnd).toBe('2026-09-18T21:59:59.933Z')
    expect(plan.validUntil).toBe('2026-09-20T05:00:00.000Z')
    expect(missing.map(m => [m.feedId, m.reason])).toEqual([['london-arrivals', 'not-configured'], ['london-docks', 'not-configured'], ['uk-bus-disruptions', 'not-configured']])
  })

  it('reports a day without a matching journal instead of guessing one', async () => {
    const h = await host()
    await h.journal('bus-day', 'short', 'bulk-archive', '2026-09-18T12:00:00Z')
    await h.journal('day-swiss-edge', 'swiss', 'swiss-edge', '2026-09-18T21:59:59.933Z')
    const { plan, missing } = await planRecorderEvidence({ registry, producerId: 'recorder-minimax', host: h.config, date: '2026-09-18' })
    expect(plan.feeds.map(f => f.feedId)).toEqual(['swiss-realtime'])
    expect(missing).toContainEqual({ feedId: 'uk-bus-archive', reason: 'no-journal-for-day', date: '2026-09-18' })
    expect(missing).toContainEqual({ feedId: 'uk-bus-archive', reason: 'no-release-pointer', date: '2026-09-18' })
  })

  it('defaults to the previous civil day in each feed\'s zone', async () => {
    const h = await host()
    await h.journal('bus-day', 'day', 'bulk-archive', '2026-09-18T22:59:59.474Z')
    await h.journal('day-swiss-edge', 'swiss', 'swiss-edge', '2026-09-18T21:59:59.933Z')
    const { plan } = await planRecorderEvidence({ registry, producerId: 'recorder-minimax', host: h.config, now: Date.parse('2026-09-19T05:30:00Z') })
    expect(plan.feeds.map(f => f.archive.expectedEnd)).toEqual(['2026-09-18T22:59:59.474Z', '2026-09-18T21:59:59.933Z'])
  })
})
