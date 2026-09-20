import { it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { observeFeeds, assessObserverCheck, OBSERVER_LIMITS } from './feed-observer.mjs'
import { dailyFeedExpectation } from './feed-expectations.mjs'
import { recorderFeedHealth } from './recorder-observability.mjs'
import { studyDay } from './uk-service-day.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const now = Date.parse('2026-09-18T12:00:00Z')
function fixture(at = now, serviceDate = '2026-09-17') {
  const registry = JSON.parse(readFileSync(new URL('../../../config/feeds/recorder.example.json', import.meta.url)))
  registry.feeds = [registry.feeds[0]]
  registry.feeds[0].stages = [registry.feeds[0].stages[0], { id: 'serve', dependsOn: ['capture'], maxAgeSeconds: null }]
  const input = { generatedAt: new Date(at).toISOString(), feeds: [{ name: 'bus-day', source: 'bulk-archive', state: 'healthy', lastCaptureAt: new Date(at - 1000).toISOString() }], disk: { freeBytes: 1000 }, capacity: { status: 'open' } }
  const report = recorderFeedHealth(registry, input, { producerId: 'recorder-minimax', now: at })
  const payload = { schemaVersion: 2, kind: 'feed-quality-history', operator: 'FBRI', from: serviceDate, to: serviceDate, days: [{ date: serviceDate, status: 'current', revision: 'b'.repeat(64), day: studyDay(serviceDate), quality: {} }] }
  let content, manifest
  const repack = () => {
    const id = sha(JSON.stringify(payload)); content = JSON.stringify({ ...payload, resultId: id }) + '\n'
    manifest = { schemaVersion: 1, observedAt: new Date(at - 1000).toISOString(), resultId: id, report: { path: `releases/${id}/result.json`, bytes: Buffer.byteLength(content), sha256: sha(content) } }
  }
  repack()
  const config = { schemaVersion: 1, kind: 'feed-observer-config', producerId: 'recorder-minimax', healthUrl: 'https://monitor.test/producer.json', consumers: [{ feedId: 'uk-bus-archive', operator: 'FBRI', manifestUrl: 'https://consumer.test/feeds/FBRI/manifest.json', timeZone: 'Europe/London', deadline: '06:00' }] }
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    if (url === config.healthUrl) return Response.json(report)
    if (url === config.consumers[0].manifestUrl) return Response.json(manifest)
    if (url === new URL(manifest.report.path, config.consumers[0].manifestUrl).href) return new Response(content)
    throw new Error('Unexpected request')
  }
  return { registry, report, config, payload, calls, fetchImpl, repack, get manifest() { return manifest }, get content() { return content }, run: (options = {}) => observeFeeds(registry, config, { fetchImpl, clock: () => at, ...options }) }
}
it('advances the expected day only when its local delivery deadline passes', () => {
  const schedule = { timeZone: 'Europe/London', deadline: '06:00' }
  const before = dailyFeedExpectation(schedule, Date.parse('2026-09-18T04:59:59Z'))
  const after = dailyFeedExpectation(schedule, Date.parse('2026-09-18T05:00:00Z'))
  expect(before.serviceDate).toBe('2026-09-16')
  expect(after.serviceDate).toBe('2026-09-17')
  expect(after.deadlineAt).toBe('2026-09-18T05:00:00.000Z')
})
it('uses the later repeated deadline and the first valid minute after a DST gap', () => {
  const schedule = { timeZone: 'Europe/London', deadline: '01:30' }
  expect(dailyFeedExpectation(schedule, Date.parse('2026-10-25T00:45:00Z')).serviceDate).toBe('2026-10-23')
  expect(dailyFeedExpectation(schedule, Date.parse('2026-10-25T01:30:00Z')).serviceDate).toBe('2026-10-24')
  const spring = dailyFeedExpectation(schedule, Date.parse('2026-03-29T01:00:00Z'))
  expect(spring.serviceDate).toBe('2026-03-28')
  expect(spring.deadlineAt).toBe('2026-03-29T01:00:00.000Z')
  expect(() => dailyFeedExpectation({ timeZone: 'bad/zone', deadline: '06:00' }, now)).toThrow()
})
it('checks a pinned consumer release in three bounded requests with separated credentials', async () => {
  const f = fixture(), r = await f.run({ tokens: { health: 'health-secret', consumers: { 'uk-bus-archive': 'consumer-secret' } } })
  expect(r.requests).toBe(3)
  expect(r.report.feeds[0].state).toBe('healthy')
  expect(r.consumers[0].reasons).toEqual(['consumer-release-verified'])
  expect(f.calls.every(c => c.options.redirect === 'manual')).toBe(true)
  expect(f.calls[0].options.headers.Authorization).toBe('Bearer health-secret')
  expect(f.calls[1].options.headers.Authorization).toBe('Bearer consumer-secret')
  expect(JSON.stringify(r)).not.toMatch(/secret|https:/)
})
it('an old but successful HTTP health response cannot renew the producer heartbeat', async () => {
  const f = fixture()
  const r = await f.run({ clock: () => now + 181000 })
  expect(r.report.telemetry.state).toBe('stale')
  expect(r.report.producerGeneratedAt).toBe(f.report.producerGeneratedAt)
  expect(r.report.feeds[0].stages.every(s => s.state === 'unknown')).toBe(true)
  expect(r.consumers[0].state).toBe('healthy')
})
it('recomputes capture age during the heartbeat allowance rather than trusting cached ages', async () => {
  const f = fixture(), r = await f.run({ clock: () => now + 95000 })
  expect(r.report.telemetry.state).toBe('current')
  expect(r.report.feeds[0].stages[0].state).toBe('degraded')
  expect(r.report.feeds[0].stages[0].metrics['capture-age-seconds']).toBe(96)
})
it('records an unavailable producer while still checking the consumer independently', async () => {
  const f = fixture()
  const r = await f.run({ fetchImpl: (url, o) => url === f.config.healthUrl ? Promise.resolve(new Response('private error', { status: 503 })) : f.fetchImpl(url, o) })
  expect(r.report.telemetry.state).toBe('missing')
  expect(r.sourceError).toBe('http-unavailable')
  expect(r.consumers[0].state).toBe('healthy')
  expect(JSON.stringify(r)).not.toContain('private error')
})
it('rejects invalid or foreign producer reports and future publication clocks', async () => {
  const f = fixture(); f.report.producerId = 'other-host'
  expect((await f.run()).sourceError).toBe('document-invalid')
  f.manifest.observedAt = new Date(now + 60000).toISOString()
  expect((await f.run()).consumers[0].reasons).toEqual(['consumer-publication-clock-invalid'])
})
it('rejects unsafe manifest paths before requesting any referenced URL', async () => {
  const f = fixture(); f.manifest.report.path = 'https://private.test/secret'
  const r = await f.run()
  expect(r.requests).toBe(2)
  expect(r.consumers[0].reasons).toEqual(['consumer-manifest-invalid'])
  expect(f.calls.some(c => c.url.includes('private.test'))).toBe(false)
})
it('verifies actual response bytes and payload identity, not just successful status', async () => {
  const f = fixture()
  const r = await f.run({ fetchImpl: (url, o) => url.includes('/releases/') ? Promise.resolve(new Response(f.content.replace('current', 'pending'))) : f.fetchImpl(url, o) })
  expect(r.consumers[0].reasons).toEqual(['consumer-release-integrity-failed'])
})
it('detects an old day or a stale selection even when all response hashes are correct', async () => {
  const old = fixture(now, '2026-09-16')
  expect((await old.run()).consumers[0].reasons).toEqual(['consumer-period-overdue'])
  const stale = fixture(); stale.payload.days[0].status = 'stale'; stale.repack()
  expect((await stale.run()).consumers[0].reasons).toEqual(['consumer-day-overdue'])
})
it('does not report the prior target green if the deadline changes during the check', async () => {
  const before = Date.parse('2026-09-18T04:59:59Z'), after = before + 2000
  const f = fixture(before, '2026-09-16')
  let clock = before
  const r = await f.run({ clock: () => clock, fetchImpl: async (url, o) => { const response = await f.fetchImpl(url, o); if (url.includes('/releases/')) clock = after; return response } })
  expect(r.consumers[0].expectation.serviceDate).toBe('2026-09-17')
  expect(r.consumers[0].reasons).toEqual(['consumer-expectation-advanced'])
})
it('bounds body size, request count and stalled requests without leaking errors', async () => {
  const f = fixture()
  const huge = await f.run({ fetchImpl: async () => new Response('private secret', { headers: { 'content-length': String(20 * 1024 * 1024) } }) })
  expect(huge.sourceError).toBe('response-too-large')
  expect(huge.consumers[0].reasons).toEqual(['consumer-response-too-large'])
  const limited = await f.run({ limits: { ...OBSERVER_LIMITS, requests: 1 } })
  expect(limited.requests).toBe(1)
  expect(limited.consumers[0].reasons).toEqual(['consumer-check-budget-exhausted'])
  const timeout = await f.run({ fetchImpl: async () => new Promise(() => {}), limits: { ...OBSERVER_LIMITS, timeoutMs: 5 } })
  expect(timeout.sourceError).toBe('request-timeout')
  expect(timeout.consumers[0].reasons).toEqual(['consumer-request-timeout'])
})
it('rejects insecure remote endpoints and skips paused consumer requests', async () => {
  const f = fixture(); f.config.healthUrl = 'http://remote.test/health'
  await expect(f.run()).rejects.toThrow()
  expect(f.calls).toHaveLength(0)
  f.config.healthUrl = 'http://127.0.0.1:4295/health'
  f.registry.feeds[0].state = 'paused'
  // Its old report disagrees with the new registry; that cannot revive the paused feed.
  const r = await f.run()
  expect(r.requests).toBe(1)
  expect(r.consumers).toEqual([])
})
it('a read-time assessment expires the checker, producer and expected day independently', async () => {
  const f = fixture(), r = await f.run()
  expect(assessObserverCheck(f.registry, r, { now }).state).toBe('healthy')
  expect(assessObserverCheck(f.registry, r, { now: now + 181000 }).reasons).toEqual(['checker-stale'])
  expect(assessObserverCheck(f.registry, r, { now: now + 181000, maxAgeSeconds: 300 }).reasons).toEqual(['telemetry-stale'])
  r.consumers[0].expectation.nextDeadlineAt = new Date(now).toISOString()
  expect(assessObserverCheck(f.registry, r, { now }).reasons).toEqual(['consumer-expectation-expired'])
  r.completedAt = new Date(now + 60000).toISOString()
  expect(assessObserverCheck(f.registry, r, { now }).reasons).toEqual(['checker-clock-invalid'])
})
it('sends Access credentials only to the selected consumer and its pinned release', async () => {
  const f = fixture(), r = await f.run({ tokens: { consumers: { 'uk-bus-archive': { accessClientId: 'access-id', accessClientSecret: 'access-secret' } } } })
  expect(r.consumers[0].state).toBe('healthy')
  expect(f.calls[0].options.headers['CF-Access-Client-Secret']).toBeUndefined()
  expect(f.calls.slice(1).every(c => c.options.headers['CF-Access-Client-Secret'] === 'access-secret')).toBe(true)
  expect(JSON.stringify(r)).not.toContain('access-secret')
})
it('rejects consumer redirects without following them or forwarding service credentials', async () => {
  const f = fixture(), requested = []
  const r = await f.run({
    tokens: { consumers: { 'uk-bus-archive': { accessClientId: 'access-id', accessClientSecret: 'access-secret' } } },
    fetchImpl: async (url, options) => {
      requested.push(url)
      if (url === f.config.healthUrl) return f.fetchImpl(url, options)
      // Model Workers, which rejects redirect: 'error' even for a successful response.
      if (options.redirect !== 'manual') throw new TypeError('Unsupported redirect mode')
      return new Response(null, { status: 302, headers: { Location: 'https://other.test/private' } })
    },
  })
  expect(r.consumers[0].reasons).toEqual(['consumer-http-unavailable'])
  expect(requested).toEqual([f.config.healthUrl, f.config.consumers[0].manifestUrl])
  expect(JSON.stringify(r)).not.toMatch(/access-secret|other.test/)
})
