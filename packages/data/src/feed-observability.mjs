/** Versioned, JSON-only contracts. No I/O, clock, Node imports or provider calls. */
const own = (o, k) => Object.hasOwn(o, k)
function object(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${label}`)
  if (Object.keys(value).some(k => !keys.includes(k))) throw new Error(`Unknown ${label} field`)
  return value
}
function text(value, label, limit = 160) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit || [...value].some(c => c.charCodeAt(0) < 32)) throw new Error(`Invalid ${label}`)
  return value
}
function id(value) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9._:-]{0,127}$/.test(value)) throw new Error('Invalid identifier')
  return value
}
function choice(value, values) {
  if (!values.includes(value)) throw new Error('Invalid enum value')
  return value
}
function number(value, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isFinite(value) || value < 0 || value > max) throw new Error('Invalid nonnegative number')
  return value
}
function seconds(value) {
  if (!Number.isInteger(value) || value < 1 || value > 366 * 86400) throw new Error('Invalid duration')
  return value
}
function array(value, max, min = 0) {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error('Invalid bounded array')
  return value
}
function unique(values) {
  if (new Set(values).size !== values.length) throw new Error('Duplicate identifier')
  return values
}
export function readOperationalTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)) throw new Error('Invalid UTC timestamp')
  const ms = Date.parse(value)
  if (!Number.isFinite(ms) || new Date(ms).toISOString() !== (value.length === 20 ? value.replace('Z', '.000Z') : value)) throw new Error('Invalid UTC timestamp')
  return new Date(ms).toISOString()
}
function header(value, kind, keys) {
  object(value, ['schemaVersion', 'kind', ...keys], kind)
  if (value.schemaVersion !== 1 || value.kind !== kind) throw new Error('Unsupported operational schema')
}
function schedule(value) {
  object(value, ['kind', 'seconds', 'timeZone', 'deadline'], 'schedule')
  if (value.kind === 'interval') {
    object(value, ['kind', 'seconds'], 'interval schedule')
    return { kind: value.kind, seconds: seconds(value.seconds) }
  }
  if (value.kind === 'daily') {
    object(value, ['kind', 'timeZone', 'deadline'], 'daily schedule')
    text(value.timeZone, 'timezone', 80)
    new Intl.DateTimeFormat('en', { timeZone: value.timeZone })
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.deadline)) throw new Error('Invalid daily deadline')
    return { kind: value.kind, timeZone: value.timeZone, deadline: value.deadline }
  }
  object(value, ['kind'], 'manual schedule')
  return { kind: choice(value.kind, ['manual', 'push']) }
}
export function readFeedRegistry(value) {
  header(value, 'feed-registry', ['id', 'heartbeatMaxAgeSeconds', 'clockSkewSeconds', 'feeds'])
  const feeds = array(value.feeds, 128, 1).map(f => {
    object(f, ['id', 'label', 'producerId', 'producerFeed', 'sourceId', 'owner', 'runbook', 'state', 'schedule', 'stages'], 'feed')
    const stages = array(f.stages, 16, 1).map(s => {
      object(s, ['id', 'dependsOn', 'maxAgeSeconds', 'sourceMaxAgeSeconds'], 'stage')
      return { id: id(s.id), dependsOn: unique(array(s.dependsOn, 16).map(id)),
        maxAgeSeconds: s.maxAgeSeconds === null ? null : seconds(s.maxAgeSeconds),
        ...(own(s, 'sourceMaxAgeSeconds') ? { sourceMaxAgeSeconds: seconds(s.sourceMaxAgeSeconds) } : {}) }
    })
    unique(stages.map(s => s.id))
    const visiting = new Set(), visited = new Set()
    const visit = stageId => {
      if (visiting.has(stageId)) throw new Error('Cyclic stage dependency')
      if (visited.has(stageId)) return
      const stage = stages.find(s => s.id === stageId)
      if (!stage) throw new Error('Unknown stage dependency')
      visiting.add(stageId); stage.dependsOn.forEach(visit); visiting.delete(stageId); visited.add(stageId)
    }
    stages.forEach(s => visit(s.id))
    return { id: id(f.id), label: text(f.label, 'label'), producerId: id(f.producerId), producerFeed: id(f.producerFeed), sourceId: id(f.sourceId),
      owner: text(f.owner, 'owner'), runbook: text(f.runbook, 'runbook', 300), state: choice(f.state, ['active', 'paused', 'setup-required']), schedule: schedule(f.schedule), stages }
  })
  unique(feeds.map(f => f.id)); unique(feeds.map(f => `${f.producerId}/${f.producerFeed}`))
  return { schemaVersion: 1, kind: 'feed-registry', id: id(value.id), heartbeatMaxAgeSeconds: seconds(value.heartbeatMaxAgeSeconds),
    clockSkewSeconds: number(value.clockSkewSeconds, 300), feeds }
}
function metrics(value) {
  object(value, Object.keys(value ?? {}), 'metrics')
  if (Object.keys(value).length > 32) throw new Error('Too many metrics')
  return Object.fromEntries(Object.entries(value).map(([key, v]) => [id(key), number(v)]))
}
function reasons(value) { return unique(array(value, 16).map(id)) }
function registered(registry, feedId, stageId) {
  const feed = registry.feeds.find(f => f.id === feedId)
  if (!feed?.stages.some(s => s.id === stageId)) throw new Error('Unregistered feed or stage')
}
export function readFeedEvent(value, registryValue) {
  header(value, 'feed-event', ['eventId', 'feedId', 'stageId', 'runId', 'parentRunId', 'producerId', 'revision', 'occurredAt', 'recordedAt', 'type', 'reasons', 'metrics'])
  const registry = readFeedRegistry(registryValue)
  registered(registry, value.feedId, value.stageId)
  if (registry.feeds.find(f => f.id === value.feedId).producerId !== value.producerId) throw new Error('Producer does not own feed')
  return { schemaVersion: 1, kind: 'feed-event', eventId: id(value.eventId), feedId: id(value.feedId), stageId: id(value.stageId), runId: id(value.runId),
    ...(own(value, 'parentRunId') ? { parentRunId: id(value.parentRunId) } : {}), producerId: id(value.producerId), revision: id(value.revision),
    occurredAt: readOperationalTime(value.occurredAt), recordedAt: readOperationalTime(value.recordedAt),
    type: choice(value.type, ['started', 'succeeded', 'failed', 'heartbeat']), reasons: reasons(value.reasons), metrics: metrics(value.metrics) }
}
export function summarizeFeedStages(stages) {
  return ['degraded', 'unknown', 'waiting'].find(state => stages.some(s => s.state === state)) ?? 'healthy'
}
export function readFeedHealth(value, registryValue) {
  header(value, 'feed-health', ['registryId', 'producerId', 'observedAt', 'producerGeneratedAt', 'telemetry', 'feeds', 'capacity'])
  const registry = readFeedRegistry(registryValue)
  if (value.registryId !== registry.id) throw new Error('Registry does not match health report')
  const producerId = id(value.producerId), expected = registry.feeds.filter(f => f.producerId === producerId)
  if (!expected.length) throw new Error('Unregistered producer')
  const observedAt = readOperationalTime(value.observedAt)
  const producerGeneratedAt = value.producerGeneratedAt === null ? null : readOperationalTime(value.producerGeneratedAt)
  object(value.telemetry, ['state', 'ageSeconds'], 'telemetry')
  const telemetry = { state: choice(value.telemetry.state, ['current', 'stale', 'missing', 'invalid']), ageSeconds: value.telemetry.ageSeconds === null ? null : number(value.telemetry.ageSeconds) }
  if (producerGeneratedAt === null) {
    if (!['missing', 'invalid'].includes(telemetry.state) || telemetry.ageSeconds !== null) throw new Error('Missing producer clock cannot establish freshness')
  } else {
    const elapsed = (Date.parse(observedAt) - Date.parse(producerGeneratedAt)) / 1000
    const state = elapsed < -registry.clockSkewSeconds ? 'invalid' : elapsed > registry.heartbeatMaxAgeSeconds ? 'stale' : 'current'
    if (telemetry.state !== state || telemetry.ageSeconds === null || Math.abs(telemetry.ageSeconds - Math.max(0, elapsed)) > 0.000001) throw new Error('Telemetry does not match report clocks')
  }
  const feeds = array(value.feeds, 128, 1).map(f => {
    object(f, ['feedId', 'configuredState', 'state', 'stages'], 'feed health')
    const entry = expected.find(e => e.id === f.feedId)
    if (!entry || f.configuredState !== entry.state) throw new Error('Feed configuration does not match registry')
    const stages = array(f.stages, 16, 1).map(s => {
      object(s, ['stageId', 'state', 'reasons', 'timestamps', 'metrics'], 'stage health')
      registered(registry, f.feedId, s.stageId)
      object(s.timestamps, ['receivedAt', 'sourceGeneratedAt', 'latestPeriodEnd', 'lastSuccessAt', 'lastAttemptAt'], 'timestamps')
      return { stageId: id(s.stageId), state: choice(s.state, ['healthy', 'degraded', 'unknown', 'waiting']), reasons: reasons(s.reasons),
        timestamps: Object.fromEntries(Object.entries(s.timestamps).map(([k, v]) => [k, readOperationalTime(v)])), metrics: metrics(s.metrics) }
    })
    unique(stages.map(s => s.stageId))
    if (stages.length !== entry.stages.length) throw new Error('Incomplete stage report')
    const state = entry.state === 'active' ? summarizeFeedStages(stages) : entry.state
    if (f.state !== state) throw new Error('Inconsistent feed summary')
    if (telemetry.state !== 'current' && stages.some(s => s.state !== 'unknown')) throw new Error('Unavailable telemetry cannot assert stage health')
    return { feedId: f.feedId, configuredState: entry.state, state, stages }
  })
  unique(feeds.map(f => f.feedId))
  if (feeds.length !== expected.length) throw new Error('Incomplete producer report')
  object(value.capacity, ['state', 'reasons', 'metrics'], 'capacity')
  const capacity = { state: choice(value.capacity.state, ['healthy', 'degraded', 'unknown']), reasons: reasons(value.capacity.reasons), metrics: metrics(value.capacity.metrics) }
  if (telemetry.state !== 'current' && capacity.state !== 'unknown') throw new Error('Unavailable telemetry cannot assert capacity health')
  return { schemaVersion: 1, kind: 'feed-health', registryId: registry.id, producerId, observedAt,
    producerGeneratedAt, telemetry, feeds, capacity }
}
