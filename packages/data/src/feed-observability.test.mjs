import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { readFeedRegistry, readFeedEvent, readFeedHealth, readOperationalTime } from './feed-observability.mjs'
import { recorderFeedHealth } from './recorder-observability.mjs'

const template = JSON.parse(readFileSync(new URL('../../../config/feeds/recorder.example.json', import.meta.url), 'utf8'))
const now = Date.parse('2026-09-17T12:05:00Z')
const stamp = seconds => new Date(now - seconds * 1000).toISOString()
const registry = () => structuredClone(template)
function status() {
  return {
    generatedAt: stamp(10), pid: 123, dataRoot: '/private/recordings',
    feeds: template.feeds.map(f => ({ name: f.producerFeed, source: f.sourceId, state: 'healthy', plan: { action: 'resume' }, lastCaptureAt: stamp(25), secondsSinceLastCapture: 15,
      sourceAgeSeconds: f.sourceId === 'swiss-edge' ? 30 : null,
      processing: { latestNormalizedHour: '2026-09-17T11', normalizationLagSeconds: 290, incompleteCloseouts: 0 }, jobs: {} })),
    analytics: { observedAt: stamp(60), months: { '2026-09': { lastSuccessAt: stamp(60), root: '/private/analytics', publications: { secret: '/private/release' } } }, pendingMonths: [], waiting: [] },
    disk: { freeBytes: 1000000, totalBytes: 2000000 },
    capacity: { status: 'open', remainingCaptureBytes: 500000, usage: { total: { committed: 1000, reserved: 100 } } },
  }
}
const report = (s = status(), r = registry(), at = now) => recorderFeedHealth(r, s, { producerId: 'recorder-minimax', now: at })
const find = (r, name, stage) => r.feeds.find(f => f.feedId === name).stages.find(s => s.stageId === stage)
const bus = (r, stage = 'capture') => find(r, 'uk-bus-archive', stage)

describe('shared contracts', () => {
  it('validates the four-feed example and the independent local analytics branch', () => {
    const r = readFeedRegistry(registry())
    expect(r.feeds).toHaveLength(4)
    expect(r.feeds[0].stages.find(s => s.id === 'analytics').dependsOn).toEqual(['normalize'])
    expect(r).not.toBe(template)
  })
  it('rejects duplicate bindings, dangling dependencies, cycles and unbounded input', () => {
    for (const change of [
      r => r.feeds.push(r.feeds[0]),
      r => { r.feeds[1].producerFeed = r.feeds[0].producerFeed },
      r => { r.feeds[0].stages[0].dependsOn = ['nonexistent'] },
      r => { r.feeds[0].stages[0].dependsOn = ['normalize'] },
      r => { r.heartbeatMaxAgeSeconds = Infinity },
      r => { r.feeds[0].label = 'x'.repeat(1000) },
      r => { r.feeds[0].secret = 'hidden' },
    ]) { const r = registry(); change(r); expect(() => readFeedRegistry(r)).toThrow() }
  })
  it('supports explicit daily, push and manual schedules without silently using minute thresholds', () => {
    const r = registry()
    r.feeds[0].schedule = { kind: 'daily', timeZone: 'Europe/London', deadline: '13:30' }
    r.feeds[1].schedule = { kind: 'push' }; r.feeds[2].schedule = { kind: 'manual' }
    expect(readFeedRegistry(r).feeds[0].schedule.deadline).toBe('13:30')
    r.feeds[0].schedule.deadline = '24:30'; expect(() => readFeedRegistry(r)).toThrow()
    r.feeds[0].schedule = { kind: 'daily', timeZone: 'Unknown/place', deadline: '13:30' }
    expect(() => readFeedRegistry(r)).toThrow()
  })
  it('rejects impossible and non-UTC timestamps; preserves milliseconds', () => {
    for (const value of ['2026-02-30T12:00:00Z', '2026-09-17', '2026-09-17T24:00:00Z', '2026-09-17T12:00:00+02:00']) expect(() => readOperationalTime(value)).toThrow()
    expect(readOperationalTime('2026-09-17T12:00:00Z')).toBe('2026-09-17T12:00:00.000Z')
    expect(readOperationalTime('2026-09-17T12:00:00.123Z')).toBe('2026-09-17T12:00:00.123Z')
  })
  it('keeps event identity stable across replay and checks feed ownership and safe fields', () => {
    const event = { schemaVersion: 1, kind: 'feed-event', eventId: 'run-1:failed', feedId: 'uk-bus-archive', stageId: 'capture', runId: 'run-1', parentRunId: 'day-1', producerId: 'recorder-minimax', revision: 'abc123', occurredAt: stamp(20), recordedAt: stamp(10), type: 'failed', reasons: ['provider-timeout'], metrics: { 'duration-seconds': 20 } }
    expect(readFeedEvent(event, registry())).toEqual(readFeedEvent(structuredClone(event), registry()))
    expect(() => readFeedEvent({ ...event, producerId: 'another-host' }, registry())).toThrow()
    expect(() => readFeedEvent({ ...event, stageId: 'unregistered' }, registry())).toThrow()
    expect(() => readFeedEvent({ ...event, error: 'https://private?token=secret' }, registry())).toThrow()
    expect(() => readFeedEvent({ ...event, metrics: { 'duration-seconds': 'secret' } }, registry())).toThrow()
  })
  it('validates report stage membership, completeness, summaries and stale-state invariants', () => {
    expect(readFeedHealth(report(), registry())).toEqual(report())
    for (const change of [
      r => { r.feeds.pop() },
      r => { r.feeds[0].stages.pop() },
      r => { r.feeds[0].stages.push(r.feeds[0].stages[0]) },
      r => { r.feeds[0].state = 'healthy' },
      r => { r.telemetry.state = 'stale' },
      r => { r.producerGeneratedAt = null },
      r => { r.telemetry.ageSeconds = 0 },
      r => { r.producerGeneratedAt = stamp(500) },
      r => { r.capacity.path = '/private/path' },
    ]) { const r = report(); change(r); expect(() => readFeedHealth(r, registry())).toThrow() }
  })
})

describe('recorder status adapter', () => {
  it('recomputes capture/normalization age and projects only safe operational fields', () => {
    const r = report()
    expect(r.telemetry).toEqual({ state: 'current', ageSeconds: 10 })
    expect(bus(r).state).toBe('healthy')
    expect(bus(r).metrics['capture-age-seconds']).toBe(25)
    expect(bus(r, 'normalize').metrics['normalization-lag-seconds']).toBe(300)
    expect(find(r, 'swiss-realtime', 'capture').metrics['source-age-seconds']).toBe(40)
    expect(JSON.stringify(r)).not.toMatch(/private|\bpid\b|secret/)
  })
  it('never turns a stale stored healthy report into a fresh heartbeat', () => {
    const r = report(status(), registry(), now + 181000)
    expect(r.telemetry.state).toBe('stale')
    expect(r.feeds.every(f => f.stages.every(s => s.state === 'unknown'))).toBe(true)
    expect(r.capacity.state).toBe('unknown')
    expect(bus(r).reasons).toEqual(['telemetry-stale'])
  })
  it('distinguishes missing, invalid and future-dated reports', () => {
    expect(report(null).telemetry.state).toBe('missing')
    expect(report({}).telemetry.state).toBe('invalid')
    const s = status(); s.generatedAt = stamp(-31)
    expect(report(s).telemetry.state).toBe('invalid')
    s.generatedAt = stamp(-20)
    expect(report(s).telemetry.state).toBe('current')
    expect(report(s).telemetry.ageSeconds).toBe(0)
  })
  it('finds a stalled capture even if a producer keeps reporting healthy', () => {
    const s = status(); s.feeds[0].lastCaptureAt = stamp(91); s.feeds[0].secondsSinceLastCapture = 1
    expect(bus(report(s)).reasons).toEqual(['capture-stale'])
    s.feeds[0].lastCaptureAt = stamp(90)
    expect(bus(report(s)).state).toBe('healthy')
  })
  it('reports old or missing source clocks separately from fresh receipts', () => {
    const s = status(); s.feeds[3].sourceAgeSeconds = 180
    const capture = find(report(s), 'swiss-realtime', 'capture')
    expect(capture.reasons).toEqual(['source-stale'])
    expect(capture.metrics['capture-age-seconds']).toBe(25)
    s.feeds[3].sourceAgeSeconds = null
    expect(find(report(s), 'swiss-realtime', 'capture').state).toBe('unknown')
    s.feeds[3].sourceAgeSeconds = -200
    expect(find(report(s), 'swiss-realtime', 'capture').state).toBe('unknown')
  })
  it('does not retain an old failure as an active incident after a fresh success', () => {
    const s = status(); s.feeds[0].lastFailure = 'old provider token=secret'
    expect(bus(report(s)).state).toBe('healthy')
    expect(JSON.stringify(report(s))).not.toContain('secret')
  })
  it('keeps missing and mismatched feeds unknown and rejects ambiguous bindings', () => {
    const s = status(); s.feeds.shift()
    expect(bus(report(s)).reasons).toEqual(['feed-missing'])
    s.feeds.push(s.feeds[0]); expect(() => report(s)).toThrow()
    const other = status(); other.feeds[0].source = 'different-source'
    expect(bus(report(other)).reasons).toEqual(['source-mismatch'])
    delete other.feeds[0].source
    expect(bus(report(other)).reasons).toEqual(['source-unavailable'])
  })
  it('keeps storage pauses, intentional pauses and normal rollover distinct', () => {
    const s = status(); s.storageError = 'secret/path missing'
    expect(bus(report(s)).reasons).toEqual(['host-storage-blocked'])
    expect(report(s).capacity.state).toBe('degraded')
    expect(JSON.stringify(report(s))).not.toContain('secret')
    const r = registry(); r.feeds[0].state = 'paused'
    expect(report(status(), r).feeds[0].state).toBe('paused')
    const next = status(); next.feeds[0].state = 'complete'
    expect(bus(report(next)).state).toBe('waiting')
    next.feeds[0].lastCaptureAt = stamp(300)
    expect(bus(report(next)).state).toBe('degraded')
    next.feeds[0].lastCaptureAt = stamp(20); next.feeds[0].plan.action = 'blocked'
    expect(bus(report(next)).reasons).toEqual(['collection-blocked'])
  })
  it('can have healthy capture and delayed normalization; future hours are unknown', () => {
    const s = status(); s.feeds[0].processing.latestNormalizedHour = '2026-09-17T09'
    expect(bus(report(s)).state).toBe('healthy')
    expect(bus(report(s), 'normalize').reasons).toEqual(['normalization-lagging'])
    s.feeds[0].processing.latestNormalizedHour = '2026-09-17T13'
    expect(bus(report(s), 'normalize').state).toBe('unknown')
  })
  it('does not allow impossible producer timestamps to become valid as a saved report ages', () => {
    const s = status(), then = Date.parse('2026-09-17T12:00:10Z')
    s.generatedAt = '2026-09-17T11:59:00Z'
    s.analytics.observedAt = '2026-09-17T12:00:00Z'
    expect(bus(report(s, registry(), then), 'normalize').reasons).toEqual(['normalized-period-in-future'])
    expect(bus(report(s, registry(), then), 'analytics').reasons).toEqual(['analytics-clock-invalid'])
  })
  it('does not infer upload success from locally complete close-outs', () => {
    expect(bus(report(), 'archive').state).toBe('unknown')
    const s = status(); s.feeds[0].processing.incompleteCloseouts = 2
    expect(bus(report(s), 'archive').state).toBe('waiting')
    s.feeds[0].jobs['process-bus-day'] = { code: 1, error: 'credential secret' }
    expect(bus(report(s), 'archive').state).toBe('degraded')
    expect(bus(report(s), 'analytics').state).toBe('healthy')
    expect(bus(report(s), 'normalize').state).toBe('healthy')
    expect(JSON.stringify(report(s))).not.toContain('secret')
  })
  it('treats open analytics inputs as waiting and checks the analytics clock independently', () => {
    const s = status(); s.analytics.waiting.push({ journal: '/private/journal', reason: 'closeout' })
    expect(bus(report(s), 'analytics').state).toBe('waiting')
    s.analytics.error = 'private credentials'
    expect(bus(report(s), 'analytics').reasons).toEqual(['analytics-job-failed'])
    s.analytics.observedAt = stamp(1801)
    expect(bus(report(s), 'analytics').reasons).toEqual(['analytics-status-stale'])
    expect(bus(report(s)).state).toBe('healthy')
  })
  it('does not claim serving or completeness from a processing success', () => {
    const r = registry(); r.feeds[0].stages.push({ id: 'deploy', dependsOn: ['analytics'], maxAgeSeconds: 60 })
    expect(bus(report(status(), r), 'deploy').reasons).toEqual(['stage-evidence-unavailable'])
  })
  it('reports capacity pauses without exporting private reasons and omits invalid forecasts', () => {
    const s = status(); s.capacity.status = 'paused'; s.capacity.pauseReason = 'private ledger path'; s.capacity.estimatedCaptureDays = Infinity
    expect(report(s).capacity.reasons).toEqual(['ledger-paused'])
    expect(report(s).capacity.metrics['estimated-capture-days']).toBeUndefined()
    s.capacity.status = 'open'; s.capacity.remainingCaptureBytes = 0
    expect(report(s).capacity.reasons).toEqual(['capture-budget-exhausted'])
  })
})
