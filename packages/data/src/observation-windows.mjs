import { createHash } from 'node:crypto'

function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)) ||
    new Date(`${value.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) !== value.slice(0, 10) || Number(value.slice(11, 13)) > 23) throw new Error('An explicit valid observation timestamp with timezone is required')
  return Date.parse(value)
}
function positive(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`Invalid ${name}`)
}

/** Hash the exact JSON bytes that are written and subsequently verified by consumers. */
export function jsonArtifact(value) {
  const json = `${JSON.stringify(value)}\n`
  return { json, bytes: Buffer.byteLength(json), sha256: createHash('sha256').update(json).digest('hex') }
}

/** Bounded offline compilation. Clock semantics and evidence kind must be named by the caller. */
export function compileObservationWindows(input, options) {
  const { startUtc, endUtc, sourceId, evidenceKind, timeBasis, windowSeconds = 7200, cadenceSeconds = 60,
    minimumRecords = 0, duplicatePolicy = 'reject', pathPrefix = 'observation-chunks',
    maxRecords = 100000, maxBytes = 256 * 1024 * 1024 } = options
  const start = instant(startUtc), end = instant(endUtc), durationSeconds = (end - start) / 1000
  positive(windowSeconds, 'window duration'); positive(cadenceSeconds, 'cadence'); positive(maxRecords, 'record limit'); positive(maxBytes, 'byte limit')
  if (typeof sourceId !== 'string' || !sourceId || typeof evidenceKind !== 'string' || !evidenceKind || !['capture-schedule', 'receipt', 'measurement'].includes(timeBasis) || end <= start ||
    !Number.isSafeInteger(minimumRecords) || minimumRecords < 0 || !['reject', 'omit', 'last'].includes(duplicatePolicy) ||
    typeof pathPrefix !== 'string' || !pathPrefix || pathPrefix.startsWith('/') || pathPrefix.split('/').some(part => part === '..' || !part)) throw new Error('Invalid observation archive options')
  const records = new Map(), rejected = new Set()
  let inputCount = 0, inputBytes = 0, duplicates = 0, conflicts = 0, outsideWindow = 0
  for (const record of input) {
    if (++inputCount > maxRecords) throw new Error('Observation record limit exceeded')
    const serialized = JSON.stringify(record)
    if (serialized === undefined || (inputBytes += Buffer.byteLength(serialized)) > maxBytes) throw new Error('Observation byte limit exceeded')
    if (!record || typeof record.id !== 'string' || !record.id || record.value === undefined) throw new Error('Observation identity and value required')
    const timestamp = instant(record.timeUtc)
    if (record.receivedAt !== undefined) instant(record.receivedAt)
    if (record.sourceRecordedAt !== undefined) instant(record.sourceRecordedAt)
    if (timestamp < start || timestamp >= end) { outsideWindow++; continue }
    if (rejected.has(record.id)) { conflicts++; continue }
    const prior = records.get(record.id)
    if (prior) {
      if (prior.serialized === serialized) { duplicates++; continue }
      conflicts++
      if (duplicatePolicy === 'reject') throw new Error(`Conflicting observation identity: ${record.id}`)
      if (duplicatePolicy === 'omit') { records.delete(record.id); rejected.add(record.id); continue }
    }
    records.set(record.id, { record, serialized, timestamp })
  }
  const ordered = [...records.values()].sort((a, b) => a.timestamp - b.timestamp || a.record.id.localeCompare(b.record.id))
  if (ordered.length < minimumRecords) throw new Error(`Observation archive has ${ordered.length} records; ${minimumRecords} required`)
  const slots = new Set(ordered.map(item => Math.floor((item.timestamp - start) / (cadenceSeconds * 1000))))
  const expectedSlots = Math.ceil(durationSeconds / cadenceSeconds)
  const missingSlots = []
  // A caller-controlled duration/cadence must not allocate an unbounded coverage index.
  if (expectedSlots > maxRecords) throw new Error('Observation coverage index limit exceeded')
  for (let slot = 0; slot < expectedSlots; slot++) if (!slots.has(slot)) missingSlots.push(slot)
  let longestGapSeconds = 0
  for (let i = 1; i < ordered.length; i++) longestGapSeconds = Math.max(longestGapSeconds, (ordered[i].timestamp - ordered[i - 1].timestamp) / 1000)
  const coverage = { inputCount, retainedRecords: ordered.length, duplicates, conflicts, outsideWindow,
    occupiedSlots: slots.size, expectedSlots, missingSlots, longestGapSeconds,
    leadingGapSeconds: ordered.length ? (ordered[0].timestamp - start) / 1000 : durationSeconds,
    trailingGapSeconds: ordered.length ? (end - ordered.at(-1).timestamp) / 1000 : durationSeconds }
  const groups = new Map()
  for (const { record, timestamp } of ordered) {
    const index = Math.floor((timestamp - start) / (windowSeconds * 1000))
    if (!groups.has(index)) groups.set(index, [])
    groups.get(index).push({ ...record, time: (timestamp - start) / 1000 })
  }
  const chunks = [...groups].map(([index, frames]) => {
    const windowStart = index * windowSeconds, windowEnd = Math.min(durationSeconds, windowStart + windowSeconds)
    const id = `${windowStart}-${windowEnd}`, artifact = { windowStart, windowEnd, frames }, encoded = jsonArtifact(artifact)
    return { descriptor: { id, windowStart, windowEnd, path: `${pathPrefix}/${id}.json`, frameCount: frames.length, bytes: encoded.bytes, sha256: encoded.sha256 }, artifact, json: encoded.json }
  })
  return { manifest: { schemaVersion: 1, sourceId, evidenceKind, timeBasis, startUtc, endUtc, durationSeconds, cadenceSeconds,
    duplicatePolicy, coverage, chunks: chunks.map(chunk => chunk.descriptor) }, chunks }
}
