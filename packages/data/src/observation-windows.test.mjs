import { test } from 'vitest'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { compileObservationWindows } from './observation-windows.mjs'
import { studyDay } from './uk-service-day.mjs'

const options = { ...studyDay('2026-09-04'), sourceId: 'source', evidenceKind: 'vehicle-position', timeBasis: 'receipt', windowSeconds: 300 }
const record = (id, timeUtc, value = { count: 0 }) => ({ id, timeUtc, receivedAt: timeUtc, sourceRefs: [`capture:${id}`], value })
test('retains zero measurements/source links, reports gaps and hashes exact published bytes', () => {
  const first = record('a', '2026-09-03T23:05:00Z'), next = record('b', '2026-09-03T23:15:00Z')
  const result = compileObservationWindows([first, first, next, record('outside', options.endUtc)], options)
  assert.equal(result.manifest.coverage.retainedRecords, 2)
  assert.equal(result.manifest.coverage.duplicates, 1)
  assert.equal(result.manifest.coverage.outsideWindow, 1)
  assert.equal(result.manifest.coverage.leadingGapSeconds, 300)
  assert.equal(result.manifest.coverage.longestGapSeconds, 600)
  assert.equal(result.chunks[0].artifact.frames[0].value.count, 0)
  assert.deepEqual(result.chunks[0].artifact.frames[0].sourceRefs, ['capture:a'])
  assert.equal(result.chunks[0].descriptor.sha256, createHash('sha256').update(result.chunks[0].json).digest('hex'))
  assert.equal(result.chunks.length, 2) // Empty intervals have no invented frames.
})
test('makes conflict policy explicit and does not claim contradictory records are independent', () => {
  const a = record('a', options.startUtc), conflict = { ...a, value: { count: 4 } }
  assert.throws(() => compileObservationWindows([a, conflict], options), /Conflicting/)
  const omitted = compileObservationWindows([a, conflict, a], { ...options, duplicatePolicy: 'omit' })
  assert.equal(omitted.manifest.coverage.retainedRecords, 0)
  assert.equal(omitted.manifest.coverage.conflicts, 2)
  const last = compileObservationWindows([a, conflict], { ...options, duplicatePolicy: 'last' })
  assert.equal(last.chunks[0].artifact.frames[0].value.count, 4)
  assert.equal(last.manifest.coverage.conflicts, 1)
})
test('uses elapsed UTC time through both 23-hour and 25-hour civil days', () => {
  for (const [date, seconds] of [['2026-03-29', 82800], ['2026-10-25', 90000]]) {
    const day = studyDay(date)
    const records = [record('first', day.startUtc), record('last', new Date(Date.parse(day.endUtc) - 60000).toISOString())]
    const result = compileObservationWindows(records, { ...options, ...day })
    assert.equal(result.manifest.durationSeconds, seconds)
    assert.equal(result.manifest.coverage.expectedSlots, seconds / 60)
    assert.equal(result.chunks.at(-1).artifact.frames[0].time, seconds - 60)
  }
})
test('enforces bounded compilation and requires explicit timestamp/clock semantics', () => {
  assert.throws(() => compileObservationWindows([record('x', '2026-09-04T10:00:00')], options), /timezone/)
  assert.throws(() => compileObservationWindows([record('x', '2026-02-30T10:00:00Z')], options), /valid observation timestamp/)
  assert.throws(() => compileObservationWindows([record('x', '2026-09-04T24:00:00Z')], options), /valid observation timestamp/)
  assert.throws(() => compileObservationWindows([record('x', options.startUtc)], { ...options, maxBytes: 1 }), /byte limit/)
  assert.throws(() => compileObservationWindows([], { ...options, minimumRecords: 1 }), /required/)
  assert.throws(() => compileObservationWindows([], { ...options, cadenceSeconds: 0 }), /cadence/)
  assert.throws(() => compileObservationWindows([], { ...options, timeBasis: undefined }), /options/)
})
