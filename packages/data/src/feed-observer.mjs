import { readFeedRegistry, readFeedHealth, readOperationalTime, summarizeFeedStages } from './feed-observability.mjs'
import { recorderFeedHealth } from './recorder-observability.mjs'
import { dailyFeedExpectation } from './feed-expectations.mjs'
import { studyDay, SERVICE_TIMEZONE } from './uk-service-day.mjs'

export const OBSERVER_LIMITS = Object.freeze({ requests: 9, totalBytes: 10 * 1024 * 1024, timeoutMs: 5000, totalMs: 30000, healthBytes: 1024 * 1024, manifestBytes: 8192, releaseBytes: 2 * 1024 * 1024 })
const digest = s => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s)
const sha = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('')
const stage = (state, reason, timestamps = {}, metrics = {}) => ({ stageId: 'serve', state, reasons: [reason], timestamps, metrics })
function checkUrl(value) {
  const url = new URL(value)
  if (url.username || url.password || url.hash || url.search || !['https:', 'http:'].includes(url.protocol) || url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Use HTTPS or loopback HTTP without embedded credentials or query strings')
  return url.href
}
function config(value, registry) {
  if (value?.schemaVersion !== 1 || value.kind !== 'feed-observer-config' || Object.keys(value).some(k => !['schemaVersion', 'kind', 'producerId', 'healthUrl', 'consumers'].includes(k))) throw new Error('Invalid observer config')
  if (!registry.feeds.some(f => f.producerId === value.producerId) || !Array.isArray(value.consumers) || value.consumers.length > 4) throw new Error('Invalid observer targets')
  const consumers = value.consumers.map(c => {
    if (!c || Object.keys(c).some(k => !['feedId', 'manifestUrl', 'operator', 'deadline', 'timeZone'].includes(k))) throw new Error('Invalid consumer config')
    if (!registry.feeds.some(f => f.id === c.feedId && f.producerId === value.producerId && f.stages.some(s => s.id === 'serve'))) throw new Error('Register the consumer serve stage')
    if (typeof c.operator !== 'string' || !c.operator.trim() || c.operator.length > 100 || c.timeZone !== SERVICE_TIMEZONE || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(c.deadline)) throw new Error('Invalid bus consumer expectation')
    return { ...c, manifestUrl: checkUrl(c.manifestUrl) }
  })
  if (new Set(consumers.map(c => c.feedId)).size !== consumers.length) throw new Error('Duplicate consumer target')
  return { producerId: value.producerId, healthUrl: checkUrl(value.healthUrl), consumers }
}
class CheckError extends Error { constructor(reason) { super(reason); this.reason = reason } }
function client(fetchImpl, tokens, limits) {
  const began = performance.now(), usage = { requests: 0, bytes: 0 }
  const read = async (url, cap, token) => {
    if (usage.requests >= limits.requests || usage.bytes >= limits.totalBytes || performance.now() - began >= limits.totalMs) throw new CheckError('check-budget-exhausted')
    usage.requests++
    const controller = new AbortController()
    let reader, body, timer
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new CheckError('request-timeout')) }, Math.min(limits.timeoutMs, limits.totalMs - (performance.now() - began))) })
    try {
      return await Promise.race([timeout, (async () => {
        const headers = { Accept: 'application/json', 'Cache-Control': 'no-cache', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        const response = await fetchImpl(url, { headers, signal: controller.signal, redirect: 'error', cache: 'no-store' })
        body = response.body
        if (!response.ok || response.redirected) throw new CheckError('http-unavailable')
        const advertised = response.headers.get('content-length')
        if (advertised !== null && (!/^\d+$/.test(advertised) || Number(advertised) > cap)) throw new CheckError('response-too-large')
        reader = response.body?.getReader()
        if (!reader) throw new CheckError('document-invalid')
        let size = 0
        const chunks = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength; usage.bytes += value.byteLength
          if (size > cap || usage.bytes > limits.totalBytes) throw new CheckError('response-too-large')
          chunks.push(value)
        }
        const bytes = new Uint8Array(size)
        let offset = 0
        for (const c of chunks) { bytes.set(c, offset); offset += c.length }
        let json
        try { json = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) } catch { throw new CheckError('document-invalid') }
        return { bytes, json }
      })()])
    } catch (e) { throw e instanceof CheckError ? e : new CheckError('request-failed') }
    finally { clearTimeout(timer); controller.abort(); if (reader) void reader.cancel().catch(() => {}); else if (body) void body.cancel().catch(() => {}) }
  }
  return { usage, health: url => read(url, limits.healthBytes, tokens.health), consumer: (url, kind, token) => read(url, limits[`${kind}Bytes`], token) }
}

/** Reevaluate a mirrored producer report at the checker's clock; never renew its heartbeat. */
function refresh(registry, raw, producerId, now) {
  const report = readFeedHealth(raw, registry)
  if (report.producerId !== producerId || Date.parse(report.observedAt) > now + registry.clockSkewSeconds * 1000) throw new Error('Unexpected producer/observer clock')
  const generated = report.producerGeneratedAt ? Date.parse(report.producerGeneratedAt) : null
  const elapsed = generated === null ? null : (now - generated) / 1000
  report.observedAt = new Date(now).toISOString()
  report.telemetry = { state: elapsed === null ? report.telemetry.state : elapsed < -registry.clockSkewSeconds ? 'invalid' : elapsed > registry.heartbeatMaxAgeSeconds ? 'stale' : 'current', ageSeconds: elapsed === null ? null : Math.max(0, elapsed) }
  for (const f of report.feeds) {
    const entry = registry.feeds.find(e => e.id === f.feedId)
    f.stages = f.stages.map(s => {
      if (report.telemetry.state !== 'current') return { ...s, state: 'unknown', reasons: [`telemetry-${report.telemetry.state}`], timestamps: {}, metrics: {} }
      const def = entry.stages.find(d => d.id === s.stageId)
      const field = { capture: 'receivedAt', normalize: 'latestPeriodEnd', analytics: 'lastAttemptAt' }[s.stageId]
      const metric = { capture: 'capture-age-seconds', normalize: 'normalization-lag-seconds', analytics: 'analytics-status-age-seconds' }[s.stageId]
      if (field && s.timestamps[field]) s.metrics[metric] = Math.max(0, (now - Date.parse(s.timestamps[field])) / 1000)
      if (s.stageId === 'capture' && s.timestamps.sourceGeneratedAt) s.metrics['source-age-seconds'] = Math.max(0, (now - Date.parse(s.timestamps.sourceGeneratedAt)) / 1000)
      if (f.configuredState !== 'active' || !['healthy', 'waiting'].includes(s.state)) return s
      if (field && def.maxAgeSeconds !== null) {
        const stamp = s.timestamps[field], age = stamp ? (now - Date.parse(stamp)) / 1000 : null
        if (age === null) return { ...s, state: 'unknown', reasons: ['stage-clock-unavailable'] }
        if (age < -registry.clockSkewSeconds) return { ...s, state: 'unknown', reasons: ['stage-clock-invalid'] }
        if (age > def.maxAgeSeconds) return { ...s, state: s.stageId === 'analytics' ? 'unknown' : 'degraded', reasons: [`${s.stageId}-stale`] }
      }
      if (s.stageId === 'capture' && def.sourceMaxAgeSeconds) {
        const stamp = s.timestamps.sourceGeneratedAt
        if (!stamp) return { ...s, state: 'unknown', reasons: ['source-time-unavailable'] }
        if ((now - Date.parse(stamp)) / 1000 < -registry.clockSkewSeconds) return { ...s, state: 'unknown', reasons: ['source-clock-invalid'] }
        if ((now - Date.parse(stamp)) / 1000 > def.sourceMaxAgeSeconds) return { ...s, state: 'degraded', reasons: ['source-stale'] }
      }
      return s
    })
    f.state = f.configuredState === 'active' ? summarizeFeedStages(f.stages) : f.configuredState
  }
  if (report.telemetry.state !== 'current') report.capacity = { state: 'unknown', reasons: [`telemetry-${report.telemetry.state}`], metrics: {} }
  return readFeedHealth(report, registry)
}

async function consumer(c, expectation, api, now, skew, token) {
  try {
    const { json: manifest } = await api.consumer(c.manifestUrl, 'manifest', token)
    const id = manifest.resultId, file = manifest.report
    if (manifest.schemaVersion !== 1 || !digest(id) || file?.path !== `releases/${id}/result.json` || !Number.isSafeInteger(file.bytes) || file.bytes < 1 || file.bytes > OBSERVER_LIMITS.releaseBytes || !digest(file.sha256)) throw new CheckError('manifest-invalid')
    const publishedAt = readOperationalTime(manifest.observedAt)
    if (Date.parse(publishedAt) > now + skew * 1000) throw new CheckError('publication-clock-invalid')
    const { json: release, bytes } = await api.consumer(new URL(file.path, c.manifestUrl).href, 'release', token)
    const { resultId, ...payload } = release
    if (bytes.length !== file.bytes || await sha(bytes) !== file.sha256 || resultId !== id || await sha(new TextEncoder().encode(JSON.stringify(payload))) !== id) throw new CheckError('release-integrity-failed')
    if (release.schemaVersion !== 2 || release.kind !== 'feed-quality-history' || release.operator !== c.operator || !Array.isArray(release.days) || release.days.length > 366) throw new CheckError('release-invalid')
    readOperationalTime(`${release.from}T00:00:00Z`); readOperationalTime(`${release.to}T00:00:00Z`)
    if (release.from > release.to) throw new CheckError('release-invalid')
    const expected = studyDay(expectation.serviceDate)
    const selected = release.days.filter(d => d.date === expectation.serviceDate)
    if (release.from > expectation.serviceDate || release.to < expectation.serviceDate || selected.length === 0) return stage('degraded', 'consumer-period-overdue')
    if (selected.length !== 1) throw new CheckError('release-invalid')
    const day = selected[0]
    if (day.status !== 'current') return stage('degraded', 'consumer-day-overdue')
    if (!digest(day.revision) || !day.quality || day.day?.startUtc !== expected.startUtc || day.day?.endUtc !== expected.endUtc || day.day?.serviceDate !== expected.serviceDate || Date.parse(publishedAt) < Date.parse(expected.endUtc)) throw new CheckError('release-day-invalid')
    return stage('healthy', 'consumer-release-verified', { lastSuccessAt: publishedAt, latestPeriodEnd: expected.endUtc }, { 'verified-release-bytes': bytes.length })
  } catch (e) { return stage('degraded', `consumer-${e instanceof CheckError ? e.reason : 'document-invalid'}`) }
}

/** Portable Web-API checker; reads configured endpoints only, with no redirects or retries. */
export async function observeFeeds(registryValue, configValue, { fetchImpl = fetch, clock = Date.now, tokens = {}, limits = OBSERVER_LIMITS } = {}) {
  const registry = readFeedRegistry(registryValue), c = config(configValue, registry)
  // Tests may lower bounds, never raise them.
  for (const [key, value] of Object.entries(OBSERVER_LIMITS)) if (!Number.isSafeInteger(limits[key]) || limits[key] < 1 || limits[key] > value) throw new Error('Invalid check limit')
  const api = client(fetchImpl, tokens, limits), startedAt = new Date(clock()).toISOString()
  let source = null, sourceError = null
  try { source = (await api.health(c.healthUrl)).json; refresh(registry, source, c.producerId, clock()) }
  catch (e) { source = null; sourceError = e instanceof CheckError ? e.reason : 'document-invalid' }
  const checks = []
  for (const target of c.consumers) {
    const definition = registry.feeds.find(f => f.id === target.feedId)
    if (definition.state !== 'active') continue
    const expectation = dailyFeedExpectation(target, clock())
    const health = await consumer(target, expectation, api, clock(), registry.clockSkewSeconds, tokens.consumers?.[target.feedId])
    checks.push({ feedId: target.feedId, expectation, ...health })
  }
  const finished = clock()
  for (const check of checks) {
    const target = c.consumers.find(t => t.feedId === check.feedId), latest = dailyFeedExpectation(target, finished)
    if (latest.serviceDate !== check.expectation.serviceDate) Object.assign(check, stage('degraded', 'consumer-expectation-advanced'), { expectation: latest })
  }
  let report
  if (source) report = refresh(registry, source, c.producerId, finished)
  else report = recorderFeedHealth(registry, sourceError === 'document-invalid' ? {} : null, { producerId: c.producerId, now: finished })
  if (report.telemetry.state === 'current') for (const check of checks) {
    const feed = report.feeds.find(f => f.feedId === check.feedId)
    const { feedId: _feedId, expectation: _expectation, ...health } = check
    feed.stages = feed.stages.map(s => s.stageId === 'serve' ? health : s)
    feed.state = summarizeFeedStages(feed.stages)
  }
  return { schemaVersion: 1, kind: 'feed-observer-check', startedAt, completedAt: new Date(finished).toISOString(), sourceError, requests: api.usage.requests, bytes: api.usage.bytes,
    report: readFeedHealth(report, registry), consumers: checks }
}

/** Assess a stored check at read time. A successful old check is historical evidence. */
export function assessObserverCheck(registryValue, checked, { now = Date.now(), maxAgeSeconds = 180 } = {}) {
  const registry = readFeedRegistry(registryValue)
  if (!Number.isFinite(now) || !Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds < 1 || maxAgeSeconds > 3600) throw new Error('Invalid observer clock/threshold')
  const unknown = reason => ({ state: 'unknown', reasons: [reason] })
  if (!checked) return unknown('checker-missing')
  try {
    if (checked.schemaVersion !== 1 || checked.kind !== 'feed-observer-check' || !Array.isArray(checked.consumers)) return unknown('checker-invalid')
    const completed = Date.parse(readOperationalTime(checked.completedAt)), started = Date.parse(readOperationalTime(checked.startedAt))
    if (started > completed || completed > now + registry.clockSkewSeconds * 1000) return unknown('checker-clock-invalid')
    if (now - completed > maxAgeSeconds * 1000) return unknown('checker-stale')
    const report = refresh(registry, checked.report, checked.report.producerId, now)
    if (report.telemetry.state !== 'current') return unknown(`telemetry-${report.telemetry.state}`)
    for (const c of checked.consumers) {
      if (Date.parse(readOperationalTime(c.expectation.nextDeadlineAt)) <= now) return unknown('consumer-expectation-expired')
      if (!['healthy', 'degraded', 'unknown', 'waiting'].includes(c.state)) return unknown('checker-invalid')
    }
    const states = [report.capacity.state, ...report.feeds.filter(f => f.configuredState === 'active').map(f => f.state), ...checked.consumers.map(c => c.state)]
    if (states.includes('degraded')) return { state: 'degraded', reasons: ['feed-attention-required'] }
    if (states.includes('unknown')) return unknown('feed-evidence-unavailable')
    return { state: 'healthy', reasons: ['check-current'] }
  } catch { return unknown('checker-invalid') }
}
