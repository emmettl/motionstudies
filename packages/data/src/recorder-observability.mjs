import { readFeedRegistry, readFeedHealth, readOperationalTime, summarizeFeedStages } from './feed-observability.mjs'

const finite = value => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER
const time = value => { try { return readOperationalTime(value) } catch { return null } }
const age = (stamp, now) => (now - Date.parse(stamp)) / 1000
const stage = (stageId, state, reasons = [], timestamps = {}, metrics = {}) => ({ stageId, state, reasons, timestamps, metrics })
const metric = (key, value) => finite(value) ? { [key]: value } : {}

/** Projection of recorder status.json. Never read paths, emit raw errors or trust cached ages/state. */
export function recorderFeedHealth(registryValue, status, { producerId, now = Date.now() } = {}) {
  const registry = readFeedRegistry(registryValue)
  const observedAt = new Date(now).toISOString(), entries = registry.feeds.filter(f => f.producerId === producerId)
  if (!entries.length) throw new Error('Unregistered producer')
  if (entries.filter(f => f.stages.some(s => s.id === 'analytics')).length > 1) throw new Error('Recorder status supports one analytics feed')
  const generatedAt = time(status?.generatedAt), reportAge = generatedAt ? age(generatedAt, now) : null
  const telemetry = { state: status === null ? 'missing' : !generatedAt || reportAge < -registry.clockSkewSeconds ? 'invalid' : reportAge > registry.heartbeatMaxAgeSeconds ? 'stale' : 'current', ageSeconds: reportAge === null ? null : Math.max(0, reportAge) }
  const unavailable = telemetry.state !== 'current'
  if (!unavailable && (!Array.isArray(status.feeds) || status.feeds.length > 128 || new Set(status.feeds.map(f => f?.name)).size !== status.feeds.length)) throw new Error('Invalid recorder feed list')
  const feeds = entries.map(entry => {
    const f = status?.feeds?.find?.(f => f?.name === entry.producerFeed)
    const stages = entry.stages.map(def => {
      if (unavailable) return stage(def.id, 'unknown', [`telemetry-${telemetry.state}`])
      if (entry.state !== 'active') return stage(def.id, 'unknown', [entry.state])
      if (!f) return stage(def.id, 'unknown', ['feed-missing'])
      if (status.storageError) return stage(def.id, 'degraded', ['host-storage-blocked'])
      if (f.error) return stage(def.id, 'unknown', ['feed-status-unavailable'])
      if (f.source !== entry.sourceId) return stage(def.id, 'unknown', [f.source ? 'source-mismatch' : 'source-unavailable'])
      if (def.id === 'capture') return capture(def, f, registry, now, generatedAt)
      if (def.id === 'normalize') return normalize(def, f, registry, now, generatedAt)
      if (def.id === 'archive') {
        // A complete close-out may be local-only. This report cannot prove an R2 upload.
        const count = f.processing?.incompleteCloseouts, job = f.jobs?.[`process-${entry.producerFeed}`]
        if (job && job.code !== 0) return stage(def.id, 'degraded', ['processing-job-failed'], {}, metric('incomplete-closeouts', count))
        return stage(def.id, finite(count) && count > 0 ? 'waiting' : 'unknown', [finite(count) && count > 0 ? 'closeouts-pending' : 'upload-evidence-unavailable'], {}, metric('incomplete-closeouts', count))
      }
      if (def.id === 'analytics') return analytics(def, status.analytics, registry, now, generatedAt)
      // Publication/serving needs separate evidence, even when a local job succeeded.
      return stage(def.id, 'unknown', ['stage-evidence-unavailable'])
    })
    return { feedId: entry.id, configuredState: entry.state, state: entry.state === 'active' ? summarizeFeedStages(stages) : entry.state, stages }
  })
  const c = status?.capacity, disk = status?.disk
  const capacity = unavailable ? { state: 'unknown', reasons: [`telemetry-${telemetry.state}`], metrics: {} } : {
    state: status.storageError || c?.status === 'paused' || c?.error || c?.remainingCaptureBytes === 0 ? 'degraded' : c?.status === 'open' && finite(disk?.freeBytes) ? 'healthy' : 'unknown',
    reasons: status.storageError ? ['host-storage-blocked'] : c?.error ? ['ledger-unavailable'] : c?.status === 'paused' ? ['ledger-paused'] : c?.remainingCaptureBytes === 0 ? ['capture-budget-exhausted'] : c?.status === 'open' && finite(disk?.freeBytes) ? [] : ['capacity-evidence-unavailable'],
    metrics: { ...metric('disk-free-bytes', disk?.freeBytes), ...metric('disk-total-bytes', disk?.totalBytes), ...metric('committed-bytes', c?.usage?.total?.committed),
      ...metric('reserved-bytes', c?.usage?.total?.reserved), ...metric('remaining-capture-bytes', c?.remainingCaptureBytes), ...metric('estimated-capture-days', c?.estimatedCaptureDays) },
  }
  return readFeedHealth({ schemaVersion: 1, kind: 'feed-health', registryId: registry.id, producerId, observedAt, producerGeneratedAt: generatedAt, telemetry, feeds, capacity }, registry)
}

function capture(def, f, registry, now, generatedAt) {
  const receivedAt = time(f.lastCaptureAt)
  if (!receivedAt) return stage(def.id, 'unknown', ['capture-time-unavailable'])
  const receivedAge = age(receivedAt, now), timestamps = { receivedAt }, metrics = { 'capture-age-seconds': Math.max(0, receivedAge) }
  if (receivedAge < -registry.clockSkewSeconds || Date.parse(receivedAt) > Date.parse(generatedAt) + registry.clockSkewSeconds * 1000) return stage(def.id, 'unknown', ['capture-clock-invalid'])
  const reasons = []
  if (def.maxAgeSeconds === null) return stage(def.id, 'unknown', ['capture-threshold-unconfigured'], timestamps, metrics)
  if (receivedAge > def.maxAgeSeconds) reasons.push('capture-stale')
  // Legacy host status stores source age at report time, not the original timestamp.
  // Advancing it by report age prevents a fresh read from making old source data fresh.
  if (finite(f.sourceAgeSeconds)) {
    const sourceGeneratedAt = new Date(Date.parse(generatedAt) - f.sourceAgeSeconds * 1000)
    if (!Number.isFinite(sourceGeneratedAt.getTime())) return stage(def.id, 'unknown', ['source-clock-invalid'], timestamps, metrics)
    timestamps.sourceGeneratedAt = sourceGeneratedAt.toISOString()
    metrics['source-age-seconds'] = Math.max(0, age(timestamps.sourceGeneratedAt, now))
    if (def.sourceMaxAgeSeconds && metrics['source-age-seconds'] > def.sourceMaxAgeSeconds) reasons.push('source-stale')
  } else if (def.sourceMaxAgeSeconds) {
    return stage(def.id, reasons.length ? 'degraded' : 'unknown', [...reasons, 'source-time-unavailable'], timestamps, metrics)
  }
  if (f.plan?.action === 'blocked') reasons.push('collection-blocked')
  if (reasons.length) return stage(def.id, 'degraded', reasons, timestamps, metrics)
  if (['complete', 'stopped'].includes(f.state) || f.plan?.action === 'wait') return stage(def.id, 'waiting', ['collection-between-runs'], timestamps, metrics)
  if (!['healthy', 'stalled'].includes(f.state)) return stage(def.id, 'unknown', ['collection-state-unrecognized'], timestamps, metrics)
  return stage(def.id, 'healthy', [], timestamps, metrics)
}

function normalize(def, f, registry, now, generatedAt) {
  const hour = f.processing?.latestNormalizedHour
  const start = typeof hour === 'string' && /^\d{4}-\d\d-\d\dT\d\d$/.test(hour) ? time(`${hour}:00:00Z`) : null
  if (!start) return stage(def.id, 'unknown', ['normalized-period-unavailable'])
  const latestPeriodEnd = new Date(Date.parse(start) + 3600000).toISOString(), lag = age(latestPeriodEnd, now)
  if (lag < -registry.clockSkewSeconds || Date.parse(latestPeriodEnd) > Date.parse(generatedAt) + registry.clockSkewSeconds * 1000) return stage(def.id, 'unknown', ['normalized-period-in-future'])
  const timestamps = { latestPeriodEnd }, metrics = { 'normalization-lag-seconds': Math.max(0, lag) }
  if (def.maxAgeSeconds === null) return stage(def.id, 'unknown', ['normalization-threshold-unconfigured'], timestamps, metrics)
  return stage(def.id, lag > def.maxAgeSeconds ? 'degraded' : 'healthy', lag > def.maxAgeSeconds ? ['normalization-lagging'] : [], timestamps, metrics)
}

function analytics(def, a, registry, now, generatedAt) {
  const attemptedAt = time(a?.observedAt)
  if (!attemptedAt) return stage(def.id, 'unknown', ['analytics-status-unavailable'])
  const elapsed = age(attemptedAt, now)
  if (elapsed < -registry.clockSkewSeconds || Date.parse(attemptedAt) > Date.parse(generatedAt) + registry.clockSkewSeconds * 1000) return stage(def.id, 'unknown', ['analytics-clock-invalid'])
  const timestamps = { lastAttemptAt: attemptedAt }
  if (def.maxAgeSeconds === null) return stage(def.id, 'unknown', ['analytics-threshold-unconfigured'], timestamps)
  if (elapsed > def.maxAgeSeconds) return stage(def.id, 'unknown', ['analytics-status-stale'], timestamps)
  if (a.error || a.job && a.job.code !== 0) return stage(def.id, 'degraded', ['analytics-job-failed'], timestamps)
  if (!Array.isArray(a.pendingMonths) || !Array.isArray(a.waiting) || !a.months || typeof a.months !== 'object' || Array.isArray(a.months) || Object.keys(a.months).length > 120) return stage(def.id, 'unknown', ['analytics-status-invalid'], timestamps)
  const months = Object.values(a.months), successes = months.map(m => time(m?.lastSuccessAt)).filter(Boolean).sort()
  if (successes.length) timestamps.lastSuccessAt = successes.at(-1)
  if (timestamps.lastSuccessAt && (age(timestamps.lastSuccessAt, now) < -registry.clockSkewSeconds || Date.parse(timestamps.lastSuccessAt) > Date.parse(generatedAt) + registry.clockSkewSeconds * 1000)) return stage(def.id, 'unknown', ['analytics-clock-invalid'])
  const metrics = { 'pending-months': a.pendingMonths.length, 'waiting-inputs': a.waiting.length }
  // Open receipt hours normally remain waiting. A fresh worker check with no work is not a failed publication.
  const waiting = a.pendingMonths.length > 0 || a.waiting.length > 0
  return stage(def.id, waiting ? 'waiting' : successes.length ? 'healthy' : 'unknown', waiting ? ['analytics-awaiting-inputs-or-work'] : successes.length ? [] : ['analytics-success-unavailable'], timestamps, metrics)
}
