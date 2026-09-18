import { createHash } from 'node:crypto'
import { isAbsolute, dirname, join } from 'node:path'
import { readOperationalFile } from './operational-files.mjs'
import { readFeedRegistry, readFeedHealth, readOperationalTime, summarizeFeedStages } from './feed-observability.mjs'
import { studyDay } from './uk-service-day.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const count = value => Number.isSafeInteger(value) && value >= 0
function keys(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k))) throw new Error('Invalid evidence plan')
}
function path(value) { if (typeof value !== 'string' || !isAbsolute(value) || value.length > 4096) throw new Error('Evidence paths must be absolute'); return value }
function date(value) { readOperationalTime(`${value}T00:00:00Z`); return value }
function readPlan(value, registry, producerId) {
  keys(value, ['schemaVersion', 'kind', 'producerId', 'validUntil', 'feeds'])
  if (value.schemaVersion !== 1 || value.kind !== 'recorder-evidence-plan' || value.producerId !== producerId || !Array.isArray(value.feeds) || value.feeds.length > 16) throw new Error('Invalid evidence plan')
  const validUntil = readOperationalTime(value.validUntil)
  const feeds = value.feeds.map(f => {
    keys(f, ['feedId', 'archive', 'publication'])
    const entry = registry.feeds.find(e => e.id === f.feedId && e.producerId === producerId)
    if (!entry) throw new Error('Unregistered evidence feed')
    const output = { feedId: f.feedId }
    for (const id of ['archive', 'publication']) if (f[id]) {
      if (!entry.stages.some(s => s.id === id)) throw new Error('Unregistered evidence stage')
      if (id === 'archive') {
        keys(f[id], ['journalPath', 'closeoutPath', 'expectedEnd', 'deadlineAt'])
        output.archive = { journalPath: path(f[id].journalPath), closeoutPath: path(f[id].closeoutPath), expectedEnd: readOperationalTime(f[id].expectedEnd), deadlineAt: readOperationalTime(f[id].deadlineAt) }
      } else {
        keys(f[id], ['pointerPath', 'operator', 'expectedThrough', 'deadlineAt'])
        if (typeof f[id].operator !== 'string' || !f[id].operator.trim() || f[id].operator.length > 100) throw new Error('Invalid operator')
        output.publication = { pointerPath: path(f[id].pointerPath), operator: f[id].operator, expectedThrough: date(f[id].expectedThrough), deadlineAt: readOperationalTime(f[id].deadlineAt) }
      }
      const end = id === 'archive' ? output.archive.expectedEnd : studyDay(output.publication.expectedThrough).endUtc
      if (Date.parse(output[id].deadlineAt) < Date.parse(end)) throw new Error('Evidence deadline precedes expected period end')
      if (Date.parse(output[id].deadlineAt) > Date.parse(validUntil)) throw new Error('Evidence deadline exceeds plan validity')
    }
    return output
  })
  if (new Set(feeds.map(f => f.feedId)).size !== feeds.length) throw new Error('Duplicate evidence feed')
  return { feeds, validUntil }
}
const result = (stageId, state, reason, timestamps = {}, metrics = {}) => ({ stageId, state, reasons: reason ? [reason] : [], timestamps, metrics })
const pending = (id, deadline, now, reason) => result(id, now > Date.parse(deadline) ? 'degraded' : 'waiting', `${reason}-${now > Date.parse(deadline) ? 'overdue' : 'pending'}`)

/** Read explicit local evidence targets; never infer paths from a status report or fetch R2. */
export async function recorderEvidenceHealth(registryValue, reportValue, planValue) {
  const registry = readFeedRegistry(registryValue), report = readFeedHealth(reportValue, registry)
  const plan = readPlan(planValue, registry, report.producerId), now = Date.parse(report.observedAt)
  let remaining = 64 * 1024 * 1024
  const read = async (path, limit) => {
    if (remaining <= 0) throw new Error('Evidence byte budget exceeded')
    const bytes = await readOperationalFile(path, Math.min(limit, remaining))
    remaining -= bytes.length
    return { bytes, json: JSON.parse(bytes) }
  }
  for (const f of plan.feeds) {
    const feed = report.feeds.find(e => e.feedId === f.feedId)
    if (report.telemetry.state !== 'current' || feed.configuredState !== 'active') continue
    const entry = registry.feeds.find(e => e.id === f.feedId)
    for (const stageId of ['archive', 'publication']) {
      if (!f[stageId]) continue
      let evidence
      try {
        evidence = now > Date.parse(plan.validUntil) ? result(stageId, 'unknown', 'evidence-plan-expired') : stageId === 'archive' ? await archive(f.archive, entry, read, now, registry.clockSkewSeconds) : await publication(f.publication, read, now, registry.clockSkewSeconds)
      } catch (error) {
        evidence = error.code === 'ENOENT' ? pending(stageId, f[stageId].deadlineAt, now, `${stageId}-evidence`) : result(stageId, 'unknown', `${stageId}-evidence-invalid`)
      }
      feed.stages = feed.stages.map(s => s.stageId === stageId ? evidence : s)
    }
    feed.state = summarizeFeedStages(feed.stages)
  }
  return readFeedHealth(report, registry)
}

async function archive(plan, entry, read, now, skew) {
  const { bytes, json: journal } = await read(plan.journalPath, 16 * 1024 * 1024)
  if (!journal.id || journal.config?.source !== entry.sourceId || !['complete', 'stopped'].includes(journal.status) || !Array.isArray(journal.attempts)) throw new Error('Invalid closed journal')
  const end = readOperationalTime(journal.plannedEnd), start = readOperationalTime(journal.startedAt)
  if (end !== plan.expectedEnd || Date.parse(end) < Date.parse(start) || Date.parse(end) > now || Date.parse(plan.deadlineAt) < Date.parse(end)) throw new Error('Invalid archive period/deadline')
  const dates = [...new Set(journal.attempts.filter(a => a.status === 'captured').map(a => readOperationalTime(a.receivedAt).slice(0, 10)))].sort()
  if (!dates.length || dates.length > 7) throw new Error('Archive has no bounded captured dates')
  const { json: record } = await read(plan.closeoutPath, 1024 * 1024)
  if (record.journalId !== journal.id || record.source !== entry.sourceId || record.journalSha256 !== hash(bytes)) throw new Error('Closeout provenance mismatch')
  const closedAt = readOperationalTime(record.closedAt)
  if (Date.parse(closedAt) > now + skew * 1000 || Date.parse(closedAt) < Date.parse(start)) throw new Error('Invalid closeout clock')
  if (JSON.stringify([...record.dates].sort()) !== JSON.stringify(dates)) throw new Error('Closeout dates differ')
  const n = record.steps?.normalise
  if (!n || n.unsupported || !Array.isArray(n.skipped) || n.skipped.length) return result('archive', 'degraded', 'archive-normalization-incomplete')
  let files = 0
  for (const d of dates) {
    if (entry.sourceId === 'bulk-archive' && (!record.steps.packs?.[d] || record.steps.packs[d].error)) return result('archive', 'degraded', 'archive-packs-incomplete')
    const upload = record.steps.upload?.[d]
    if (!upload) return pending('archive', plan.deadlineAt, now, 'archive-upload')
    for (const key of ['normalized', 'publish']) {
      const u = upload[key]
      if (key === 'publish' && u === null && entry.sourceId !== 'bulk-archive') continue
      if (!u) return pending('archive', plan.deadlineAt, now, 'archive-upload')
      if (u.error || u.stopped || u.failed > 0) return result('archive', 'degraded', 'archive-upload-failed')
      if (![u.files, u.uploaded, u.skipped, u.failed].every(count) || u.failed !== 0 || u.files < 1 || u.uploaded + u.skipped !== u.files) throw new Error('Invalid upload accounting')
      files += u.files
    }
  }
  return result('archive', 'healthy', 'archive-closeout-verified', { latestPeriodEnd: end, lastSuccessAt: closedAt }, { 'recorded-upload-files': files })
}

async function publication(plan, read, now, skew) {
  const { bytes: pointerBytes, json: pointer } = await read(plan.pointerPath, 8192)
  if (pointer.schemaVersion !== 1 || pointer.kind !== 'feed-quality-release-pointer' || !digest(pointer.resultId) || pointer.operator !== plan.operator) throw new Error('Invalid release pointer')
  const observedAt = readOperationalTime(pointer.observedAt), from = date(pointer.from), to = date(pointer.to)
  if (Date.parse(observedAt) > now + skew * 1000 || from > to) throw new Error('Invalid publication clock/range')
  // The caller selects the pointer; only a validated digest can select its sibling immutable artifact.
  const dir = join(dirname(dirname(plan.pointerPath)), 'quality-releases', pointer.resultId)
  const { json: manifest } = await read(join(dir, 'manifest.json'), 4096)
  const file = manifest.files?.[0]
  if (manifest.schemaVersion !== 1 || manifest.resultId !== pointer.resultId || manifest.files?.length !== 1 || file.path !== 'result.json' || !count(file.bytes) || !digest(file.sha256)) throw new Error('Invalid release manifest')
  const { bytes, json: release } = await read(join(dir, 'result.json'), 2 * 1024 * 1024)
  const { resultId, ...payload } = release
  if (file.bytes !== bytes.length || file.sha256 !== hash(bytes) || resultId !== pointer.resultId || hash(JSON.stringify(payload)) !== resultId) throw new Error('Release integrity mismatch')
  if (release.schemaVersion !== 2 || release.kind !== 'feed-quality-history' || release.operator !== plan.operator || release.from !== from || release.to !== to || !Array.isArray(release.days) || release.days.length > 366) throw new Error('Release selection mismatch')
  if (!(await read(plan.pointerPath, 8192)).bytes.equals(pointerBytes)) throw new Error('Release selection changed during check')
  const days = new Map()
  for (const d of release.days) {
    date(d.date)
    if (days.has(d.date) || d.date < from || d.date > to) throw new Error('Invalid release day membership')
    days.set(d.date, d)
  }
  if (from > plan.expectedThrough || to < plan.expectedThrough || !days.has(plan.expectedThrough)) return pending('publication', plan.deadlineAt, now, 'publication-period')
  const selected = days.get(plan.expectedThrough)
  const expected = studyDay(plan.expectedThrough)
  if (Date.parse(plan.deadlineAt) < Date.parse(expected.endUtc) || Date.parse(expected.endUtc) > now + skew * 1000 || Date.parse(observedAt) < Date.parse(expected.endUtc)) throw new Error('Invalid publication deadline/period')
  if (selected.status !== 'current') return pending('publication', plan.deadlineAt, now, 'publication-day')
  if (!digest(selected.revision) || !selected.quality || selected.day?.serviceDate !== plan.expectedThrough || selected.day?.startUtc !== expected.startUtc || selected.day?.endUtc !== expected.endUtc) throw new Error('Invalid selected day')
  return result('publication', 'healthy', 'publication-artifact-verified', { lastSuccessAt: observedAt, latestPeriodEnd: expected.endUtc }, { 'verified-release-bytes': bytes.length })
}
