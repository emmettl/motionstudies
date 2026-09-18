import { it, expect } from 'vitest'
import worker, { FeedObserver, type Env, type Storage } from './worker.ts'
import registry from '../../config/feeds/recorder.example.json'
import { recorderFeedHealth } from '../../packages/data/src/recorder-observability.mjs'

const start = Date.parse('2026-09-18T12:00:00Z')
const pushToken = 'p'.repeat(32), readToken = 'r'.repeat(32)
function fixture() {
  const records = new Map<string, unknown>()
  const store: Storage = { get: async <T>(k: string) => structuredClone(records.get(k)) as T | undefined, put: async (k, v) => { records.set(k, structuredClone(v)) } }
  let now = start, calls = 0, objectCalls = 0
  const config = { enabled: true, consumers: [] }
  const env: Env = { OBSERVER_CONFIG: config, FEED_PUSH_TOKEN: pushToken, FEED_READ_TOKEN: readToken,
    REQUEST_LIMITER: { limit: async () => ({ success: true }) },
    OBSERVER: { getByName: () => ({ fetch: (r: Request) => { objectCalls++; return object.fetch(r) } }) } }
  let object = new FeedObserver({ storage: store }, env, async () => { calls++; throw new Error('No endpoint configured') }, () => now)
  const report = (at = now) => recorderFeedHealth(registry, { generatedAt: new Date(at).toISOString(), feeds: [] }, { producerId: 'recorder-minimax', now: at })
  const request = (path: string, method = 'GET', token?: string, body?: unknown) => worker.fetch(new Request(`https://motionstudies.app/api/feeds/v1/${path}`, { method, headers: token ? { Authorization: `Bearer ${token}` } : {}, body: body === undefined ? undefined : JSON.stringify(body) }), env)
  return { records, config, env, report, request, get calls() { return calls }, get objectCalls() { return objectCalls }, advance: (ms: number) => { now += ms }, restart: () => { object = new FeedObserver({ storage: store }, env, fetch, () => now) }, tick: () => worker.scheduled({}, env) }
}
it('separates push/read credentials and exposes no manual check route', async () => {
  const f = fixture()
  expect((await f.request('producer', 'PUT', readToken, f.report())).status).toBe(401)
  expect((await f.request('status', 'GET', pushToken)).status).toBe(401)
  expect((await f.request('check', 'POST', pushToken)).status).toBe(404)
  expect((await f.request('status')).status).toBe(401)
  expect(f.objectCalls).toBe(0)
  expect((await f.request('producer', 'PUT', pushToken, f.report())).status).toBe(200)
})
it('rejects large, malformed and foreign reports without replacing stored evidence', async () => {
  const f = fixture(), report = f.report()
  await f.request('producer', 'PUT', pushToken, report)
  expect((await f.request('producer', 'PUT', pushToken, { ...report, producerId: 'other' })).status).toBe(400)
  expect((await f.request('producer', 'PUT', pushToken, { padding: 'x'.repeat(65537) })).status).toBe(400)
  expect((f.records.get('producer') as { report: unknown }).report).toEqual(report)
})
it('deduplicates replays, rejects rollback and rate-limits new writes across restarts', async () => {
  const f = fixture(), first = f.report()
  await f.request('producer', 'PUT', pushToken, first)
  f.advance(1000); f.restart()
  expect((await (await f.request('producer', 'PUT', pushToken, first)).json()).replay).toBe(true)
  expect((await f.request('producer', 'PUT', pushToken, f.report())).status).toBe(429)
  f.advance(30000)
  expect((await f.request('producer', 'PUT', pushToken, f.report())).status).toBe(200)
  expect((await f.request('producer', 'PUT', pushToken, first)).status).toBe(409)
})
it('ages the original producer heartbeat and marks a stopped checker stale on status reads', async () => {
  const f = fixture()
  expect((await (await f.request('status', 'GET', readToken)).json()).reasons).toEqual(['checker-missing'])
  await f.request('producer', 'PUT', pushToken, f.report())
  await f.tick()
  f.advance(181000)
  expect((await (await f.request('status', 'GET', readToken)).json()).reasons).toEqual(['checker-stale'])
  await f.tick()
  const status = await (await f.request('status', 'GET', readToken)).json()
  expect(status.reasons).toEqual(['telemetry-stale'])
  expect(status.lastCheck.report.producerGeneratedAt).toBe(new Date(start).toISOString())
  expect(f.calls).toBe(0)
})
it('reserves attempts before checks, surviving concurrent delivery, failure and restart', async () => {
  const f = fixture()
  f.env.FEED_CONSUMER_TOKENS_JSON = 'invalid json'
  const results = await Promise.allSettled([f.tick(), f.tick()])
  expect(results.map(r => r.status)).toEqual(['rejected', 'fulfilled'])
  expect(f.records.get('attempt')).toBe(start)
  expect((await (await f.request('status', 'GET', readToken)).json()).reasons).toEqual(['checker-failed'])
  f.restart(); delete f.env.FEED_CONSUMER_TOKENS_JSON
  await f.tick()
  expect((f.records.get('check') as { failedAt: unknown }).failedAt).not.toBeNull()
  f.advance(60000); await f.tick()
  expect((f.records.get('check') as { failedAt: unknown }).failedAt).toBeNull()
})
it('disabled observers do not check or present a saved healthy result', async () => {
  const f = fixture(); f.config.enabled = false
  await f.tick()
  expect(f.objectCalls).toBe(0)
  expect((await f.request('status', 'GET', readToken)).status).toBe(503)
})
