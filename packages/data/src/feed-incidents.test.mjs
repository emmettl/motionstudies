import { it, expect, onTestFinished } from 'vitest'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { recorderFeedHealth } from './recorder-observability.mjs'
import { summarizeFeedStages } from './feed-observability.mjs'
import { readIncidentStore, updateIncidentStore } from './feed-incidents.mjs'

const start = Date.parse('2026-09-18T12:00:00Z')
async function fixture(policy) {
  const root = await mkdtemp(join(tmpdir(), 'feed-incidents-')), store = join(root, 'history')
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  const registry = JSON.parse(await readFile(new URL('../../../config/feeds/recorder.example.json', import.meta.url)))
  registry.feeds = [registry.feeds[0]]; registry.feeds[0].stages = registry.feeds[0].stages.filter(s => ['capture', 'normalize'].includes(s.id))
  function report(seconds, bad = false, overrides = {}) {
    const now = start + seconds * 1000, stamp = new Date(now).toISOString()
    const input = { generatedAt: stamp, disk: { freeBytes: 1000 }, capacity: { status: 'open' }, feeds: [{ name: 'bus-day', source: 'bulk-archive', state: 'healthy', lastCaptureAt: new Date(now - (bad ? 400000 : 1000)).toISOString(), processing: { latestNormalizedHour: new Date(now - 3600000).toISOString().slice(0, 13) } }], ...overrides }
    return recorderFeedHealth(registry, input, { producerId: 'recorder-minimax', now })
  }
  return { store, registry, report, update: r => updateIncidentStore(store, registry, r, { policy, now: Date.parse(r.observedAt) }) }
}
it('opens once after debounce, survives reopening, deduplicates replay and records verified recovery', async () => {
  const f = await fixture()
  expect((await f.update(f.report(0, true))).events).toEqual([])
  const r = f.report(120, true), opened = await f.update(r)
  expect(opened.events.map(e => e.transition)).toEqual(['opened'])
  expect((await readIncidentStore(f.store)).events).toHaveLength(1)
  expect((await f.update(r)).changed).toBe(false)
  expect((await f.update(f.report(130))).events).toHaveLength(0)
  expect((await f.update(f.report(190))).events.map(e => e.transition)).toEqual(['recovered'])
  expect(Object.keys((await readIncidentStore(f.store)).active)).toHaveLength(0)
  await f.update(f.report(200, true))
  const reopened = await f.update(f.report(320, true))
  expect(reopened.events[0].incidentId).not.toBe(opened.events[0].incidentId)
})
it('keeps an incident open across unknown, waiting and paused states', async () => {
  const f = await fixture({ openAfterSeconds: 0, recoverAfterSeconds: 0 })
  await f.update(f.report(0, true))
  const waiting = f.report(10)
  waiting.feeds[0].stages[0].state = 'waiting'; waiting.feeds[0].stages[0].reasons = ['collection-between-runs']
  waiting.feeds[0].state = summarizeFeedStages(waiting.feeds[0].stages)
  expect(Object.keys((await f.update(waiting)).state.active)).toHaveLength(1)
  f.registry.feeds[0].state = 'paused'
  expect(Object.keys((await f.update(f.report(20))).state.active)).toHaveLength(1)
})
it('a replayed producer heartbeat cannot confirm recovery solely by changing observer time', async () => {
  const f = await fixture({ openAfterSeconds: 0, recoverAfterSeconds: 60 })
  await f.update(f.report(0, true))
  await f.update(f.report(10))
  const replay = f.report(10)
  replay.observedAt = new Date(start + 70000).toISOString(); replay.telemetry.ageSeconds = 60
  expect(Object.keys((await f.update(replay)).state.active)).toHaveLength(1)
  expect((await f.update(f.report(80))).events.map(e => e.transition)).toEqual(['recovered'])
})
it('groups a host outage into one telemetry incident and suppresses dependent symptoms', async () => {
  const f = await fixture({ openAfterSeconds: 0 })
  const missing = recorderFeedHealth(f.registry, null, { producerId: 'recorder-minimax', now: start })
  const opened = await f.update(missing)
  expect(opened.events).toHaveLength(1)
  expect(opened.events[0].stageId).toBe('telemetry')
  const next = await fixture({ openAfterSeconds: 0 })
  const r = next.report(0, true)
  r.feeds[0].stages[1].state = 'degraded'; r.feeds[0].stages[1].reasons = ['normalization-lagging']
  expect((await next.update(r)).events.map(e => e.stageId)).toEqual(['capture'])
})
it('updates reasons without duplicate incidents; rejects conflicting and out-of-order reports', async () => {
  const f = await fixture({ openAfterSeconds: 0 })
  await f.update(f.report(0, true))
  const r = f.report(10, true); r.feeds[0].stages[0].reasons = ['collection-blocked']
  expect((await f.update(r)).events.map(e => e.transition)).toEqual(['updated'])
  await expect(f.update(f.report(10, true))).rejects.toThrow('conflicting')
  await expect(f.update(f.report(0, true))).rejects.toThrow('Out-of-order')
  expect((await readIncidentStore(f.store)).events).toHaveLength(2)
})
it('prunes only whole recovered incidents after retention and preserves unresolved history', async () => {
  const f = await fixture({ openAfterSeconds: 0, recoverAfterSeconds: 0, retentionDays: 1 })
  await f.update(f.report(0, true)); await f.update(f.report(10))
  await f.update(f.report(20, true))
  const state = (await f.update(f.report(2 * 86400, true))).state
  expect(state.prunedEvents).toBe(2)
  expect(state.events).toHaveLength(1)
  expect(Object.keys(state.active)).toHaveLength(1)
})
it('fails closed on event capacity without losing the committed cursor or active incident', async () => {
  const f = await fixture({ openAfterSeconds: 0, recoverAfterSeconds: 0, maxEvents: 1 })
  await f.update(f.report(0, true))
  const before = await readFile(join(f.store, 'state.json'), 'utf8')
  await expect(f.update(f.report(10))).rejects.toThrow('budget exhausted')
  expect(await readFile(join(f.store, 'state.json'), 'utf8')).toBe(before)
})
it('does not overwrite corrupt state, missing state, or an abandoned writer lock', async () => {
  const f = await fixture({ openAfterSeconds: 0 })
  await f.update(f.report(0, true))
  const file = join(f.store, 'state.json'), bytes = await readFile(file, 'utf8')
  await writeFile(file, bytes.replace('capture-stale', 'capture-other'))
  await expect(f.update(f.report(10))).rejects.toThrow('checksum')
  await writeFile(file, bytes)
  await writeFile(`${f.store}.lock`, '{}')
  await expect(f.update(f.report(10))).rejects.toThrow()
  expect(await readFile(file, 'utf8')).toBe(bytes)
  await rm(`${f.store}.lock`); await rm(file)
  await expect(f.update(f.report(10))).rejects.toThrow()
})
it('serializes concurrent attempts and ignores uncommitted temporary files', async () => {
  const f = await fixture({ openAfterSeconds: 0 })
  const results = await Promise.allSettled([f.update(f.report(0, true)), f.update(f.report(0, true))])
  expect(results.some(r => r.status === 'fulfilled')).toBe(true)
  expect((await readIncidentStore(f.store)).events).toHaveLength(1)
  await writeFile(join(f.store, '.state-interrupted'), '{ broken')
  expect((await f.update(f.report(10, true))).state.events).toHaveLength(1)
})
