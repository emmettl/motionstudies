import { createHash, randomUUID } from 'node:crypto'
import { mkdir, lstat, open, rename, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { hostname } from 'node:os'
import { readFeedRegistry, readFeedHealth, readOperationalTime } from './feed-observability.mjs'
import { readOperationalFile } from './operational-files.mjs'

const MAX_BYTES = 8 * 1024 * 1024
export const INCIDENT_POLICY = Object.freeze({ openAfterSeconds: 120, recoverAfterSeconds: 60, retentionDays: 180, maxEvents: 10000 })
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v)
const hash = value => createHash('sha256').update(value).digest('hex')
const notInstrumented = new Set(['upload-evidence-unavailable', 'stage-evidence-unavailable', 'capture-threshold-unconfigured', 'normalization-threshold-unconfigured', 'analytics-threshold-unconfigured'])
function policy(value) {
  const p = { ...INCIDENT_POLICY, ...value }
  if (Object.keys(p).some(k => !Object.hasOwn(INCIDENT_POLICY, k)) || Object.values(p).some(n => !Number.isSafeInteger(n) || n < 0) || p.openAfterSeconds > 86400 || p.recoverAfterSeconds > 86400 || p.retentionDays < 1 || p.retentionDays > 3650 || p.maxEvents < 1 || p.maxEvents > 20000) throw new Error('Invalid incident policy')
  return p
}
function validateState(state) {
  if (!state || state.schemaVersion !== 1 || state.kind !== 'feed-incident-state' || typeof state.registryId !== 'string' || typeof state.producerId !== 'string') throw new Error('Invalid incident state')
  policy(state.policy)
  readOperationalTime(state.lastObservedAt)
  if (!/^[a-f0-9]{64}$/.test(state.lastReportId) || !Array.isArray(state.events) || state.events.length > state.policy.maxEvents) throw new Error('Invalid incident cursor/history')
  for (const field of ['active', 'pending']) if (!state[field] || typeof state[field] !== 'object' || Array.isArray(state[field]) || Object.keys(state[field]).length > 4096) throw new Error('Invalid incident index')
  if (!Number.isSafeInteger(state.prunedEvents) || state.prunedEvents < 0) throw new Error('Invalid retention counter')
  for (const event of state.events) {
    if (!/^[a-f0-9]{64}$/.test(event.id) || !/^[a-f0-9]{64}$/.test(event.incidentId) || !['opened', 'updated', 'recovered'].includes(event.transition)) throw new Error('Invalid incident event')
    readOperationalTime(event.at)
  }
  if (new Set(state.events.map(e => e.id)).size !== state.events.length) throw new Error('Duplicate incident event')
  return state
}
/** Reads the last atomically committed state; corruption never initializes a new history. */
export async function readIncidentStore(root) {
  const wrapper = JSON.parse(await readOperationalFile(join(root, 'state.json'), MAX_BYTES))
  if (wrapper.sha256 !== hash(canonical(wrapper.state))) throw new Error('Incident state checksum mismatch')
  return validateState(wrapper.state)
}
function conditions(report, registry) {
  const entries = [], add = (feedId, stageId, disposition, state, reasons) => {
    entries.push({ key: JSON.stringify([report.producerId, feedId, stageId]), feedId, stageId, disposition, state, reasons: [...reasons].sort() })
  }
  const available = report.telemetry.state === 'current'
  add(null, 'telemetry', available ? 'healthy' : 'problem', available ? 'healthy' : 'unknown', available ? [] : [`telemetry-${report.telemetry.state}`])
  add(null, 'capacity', !available ? 'hold' : report.capacity.state === 'healthy' ? 'healthy' : 'problem', report.capacity.state, report.capacity.reasons)
  for (const feed of report.feeds) {
    const definition = registry.feeds.find(f => f.id === feed.feedId)
    const actionable = stage => stage.state === 'degraded' || stage.state === 'unknown' && !stage.reasons.some(r => notInstrumented.has(r))
    const blocked = id => definition.stages.find(s => s.id === id).dependsOn.some(parent => actionable(feed.stages.find(s => s.stageId === parent)) || blocked(parent))
    for (const stage of feed.stages) {
      let disposition = !available || feed.configuredState !== 'active' ? 'hold' : stage.state === 'healthy' ? 'healthy' : actionable(stage) ? 'problem' : 'hold'
      if (disposition === 'problem' && (blocked(stage.stageId) || stage.reasons.includes('host-storage-blocked'))) disposition = 'hold'
      add(feed.feedId, stage.stageId, disposition, stage.state, stage.reasons)
    }
  }
  return entries
}
function advance(previous, report, registry, p) {
  const at = report.observedAt, now = Date.parse(at), reportId = hash(canonical(report))
  if (previous) {
    if (previous.registryId !== registry.id || previous.producerId !== report.producerId || canonical(previous.policy) !== canonical(p)) throw new Error('Store identity/policy mismatch')
    const order = now - Date.parse(previous.lastObservedAt)
    if (order < 0 || order === 0 && previous.lastReportId !== reportId) throw new Error('Out-of-order or conflicting observation')
    if (order === 0) return { state: previous, changed: false, events: [] }
  }
  const state = previous ? structuredClone(previous) : { schemaVersion: 1, kind: 'feed-incident-state', registryId: registry.id, producerId: report.producerId, policy: p, active: {}, pending: {}, events: [], prunedEvents: 0 }
  const transitions = []
  const emit = (incident, transition, health, reasons) => {
    const event = { incidentId: incident.incidentId, key: incident.key, feedId: incident.feedId, stageId: incident.stageId, firstDetectedAt: incident.firstDetectedAt, at, transition, state: health, reasons }
    transitions.push({ id: hash(canonical(event)), ...event })
  }
  const observedKeys = new Set()
  for (const condition of conditions(report, registry)) {
    const { key, disposition, state: health, reasons, feedId, stageId } = condition
    observedKeys.add(key)
    let incident = state.active[key]
    if (disposition === 'problem') {
      if (!incident) {
        const candidate = state.pending[key] ?? { since: at }
        state.pending[key] = candidate
        if (now - Date.parse(candidate.since) < p.openAfterSeconds * 1000) continue
        incident = { key, feedId, stageId, incidentId: hash(canonical([key, candidate.since])), firstDetectedAt: candidate.since, openedAt: at, lastObservedAt: at, state: health, reasons }
        state.active[key] = incident; delete state.pending[key]
        emit(incident, 'opened', health, reasons)
      } else {
        if (incident.state !== health || canonical(incident.reasons) !== canonical(reasons)) emit(incident, 'updated', health, reasons)
        incident.state = health; incident.reasons = reasons; incident.lastObservedAt = at
      }
      delete incident.recoveryStartedAt; delete incident.recoveryProducerAt
    } else {
      delete state.pending[key]
      if (!incident) continue
      if (disposition === 'hold') { delete incident.recoveryStartedAt; delete incident.recoveryProducerAt; continue }
      incident.recoveryStartedAt ??= at
      incident.recoveryProducerAt ??= report.producerGeneratedAt
      // Fresh observer timestamps alone cannot make a replayed producer report confirm recovery.
      const fresh = p.recoverAfterSeconds === 0 || Date.parse(report.producerGeneratedAt) > Date.parse(incident.recoveryProducerAt)
      if (fresh && now - Date.parse(incident.recoveryStartedAt) >= p.recoverAfterSeconds * 1000) {
        emit(incident, 'recovered', 'healthy', reasons)
        delete state.active[key]
      }
    }
  }
  // Removed/paused scopes cannot silently recover existing incidents.
  for (const key of Object.keys(state.pending)) if (!observedKeys.has(key)) delete state.pending[key]
  for (const [key, incident] of Object.entries(state.active)) if (!observedKeys.has(key)) { delete incident.recoveryStartedAt; delete incident.recoveryProducerAt }
  state.events.push(...transitions)
  const cutoff = now - p.retentionDays * 86400000
  const expired = new Set(state.events.filter(e => e.transition === 'recovered' && Date.parse(e.at) < cutoff).map(e => e.incidentId))
  for (const incident of Object.values(state.active)) expired.delete(incident.incidentId)
  const before = state.events.length
  state.events = state.events.filter(e => !expired.has(e.incidentId))
  state.prunedEvents += before - state.events.length
  state.lastObservedAt = at; state.lastReportId = reportId; state.report = report
  if (state.events.length > p.maxEvents) throw new Error('Incident history event budget exhausted; archive before continuing')
  return { state: validateState(state), changed: true, events: transitions }
}

/** Single-writer transaction: checksum + fsync + atomic rename. A leftover lock fails closed. */
export async function updateIncidentStore(root, registryValue, reportValue, { policy: requestedPolicy, now = Date.now() } = {}) {
  const registry = readFeedRegistry(registryValue), report = readFeedHealth(reportValue, registry), p = policy(requestedPolicy)
  if (!Number.isFinite(now) || now - Date.parse(report.observedAt) > registry.heartbeatMaxAgeSeconds * 1000 || Date.parse(report.observedAt) - now > registry.clockSkewSeconds * 1000) throw new Error('Incident observation is not current')
  root = resolve(root)
  // Serialize directory creation as well as updates: a second initializer must not
  // take the writer lock before the directory creator has committed its first state.
  const lockPath = `${root}.lock`, lock = await open(lockPath, 'wx', 0o600)
  const temporary = join(root, `.state-${randomUUID()}`)
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, host: hostname(), startedAt: new Date(now).toISOString() }))
    await lock.sync()
    let created = false
    try { await mkdir(root, { mode: 0o700 }); created = true } catch (error) { if (error.code !== 'EEXIST') throw error }
    if (!(await lstat(root)).isDirectory()) throw new Error('Incident store must be a real directory')
    const previous = created ? null : await readIncidentStore(root)
    const update = advance(previous, report, registry, p)
    if (!update.changed) return update
    const content = canonical({ sha256: hash(canonical(update.state)), state: update.state }) + '\n'
    if (Buffer.byteLength(content) > MAX_BYTES) throw new Error('Incident history byte budget exhausted; archive before continuing')
    const output = await open(temporary, 'wx', 0o600)
    try { await output.writeFile(content); await output.sync() } finally { await output.close() }
    await rename(temporary, join(root, 'state.json'))
    const directory = await open(root, 'r')
    try { await directory.sync() } finally { await directory.close() }
    return update
  } finally {
    await lock.close()
    try { await rm(temporary, { force: true }) } finally { await rm(lockPath) }
  }
}
