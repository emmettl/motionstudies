import { it, expect, onTestFinished } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { recorderFeedHealth } from './recorder-observability.mjs'
import { recorderEvidenceHealth } from './recorder-evidence.mjs'
import { studyDay } from './uk-service-day.mjs'

const now = Date.parse('2026-09-18T12:00:00Z'), at = new Date(now).toISOString()
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const encode = value => JSON.stringify(value) + '\n'
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'recorder-evidence-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  const registry = JSON.parse(await readFile(new URL('../../../config/feeds/recorder.example.json', import.meta.url)))
  registry.feeds = [registry.feeds[0]]
  registry.feeds[0].stages = registry.feeds[0].stages.filter(s => s.id !== 'analytics')
  registry.feeds[0].stages.find(s => s.id === 'publication').dependsOn = ['normalize']
  const report = recorderFeedHealth(registry, { generatedAt: at, feeds: [{ name: 'bus-day', source: 'bulk-archive', state: 'healthy', lastCaptureAt: at, processing: { latestNormalizedHour: '2026-09-18T11', incompleteCloseouts: 0 } }], capacity: { status: 'open' }, disk: { freeBytes: 1000 } }, { producerId: 'recorder-minimax', now })
  const journal = { id: 'journal-1', status: 'complete', config: { source: 'bulk-archive' }, startedAt: '2026-09-17T00:00:00Z', plannedEnd: '2026-09-18T00:00:00Z', attempts: [{ status: 'captured', receivedAt: '2026-09-17T01:00:00Z' }] }
  const journalPath = join(root, 'journal.json'), closeoutPath = join(root, 'closeout.json')
  await writeFile(journalPath, encode(journal))
  const upload = { files: 2, uploaded: 1, skipped: 1, failed: 0, stopped: null }
  const record = { journalId: journal.id, journalSha256: hash(encode(journal)), source: 'bulk-archive', dates: ['2026-09-17'], closedAt: '2026-09-18T00:10:00Z', steps: { normalise: { skipped: [] }, packs: { '2026-09-17': {} }, upload: { '2026-09-17': { normalized: upload, publish: upload } } } }
  await writeFile(closeoutPath, encode(record))
  const pointerPath = join(root, 'quality-release-pointers', 'selection.json')
  await mkdir(join(root, 'quality-release-pointers'))
  const payload = { schemaVersion: 2, kind: 'feed-quality-history', operator: 'FBRI', from: '2026-09-17', to: '2026-09-17', days: [{ date: '2026-09-17', status: 'current', revision: 'a'.repeat(64), day: studyDay('2026-09-17'), quality: {} }] }
  const publish = async () => {
    const id = hash(JSON.stringify(payload)), dir = join(root, 'quality-releases', id)
    await mkdir(dir, { recursive: true })
    const bytes = encode({ ...payload, resultId: id })
    await writeFile(join(dir, 'result.json'), bytes)
    await writeFile(join(dir, 'manifest.json'), encode({ schemaVersion: 1, resultId: id, files: [{ path: 'result.json', bytes: Buffer.byteLength(bytes), sha256: hash(bytes) }] }))
    await writeFile(pointerPath, encode({ schemaVersion: 1, kind: 'feed-quality-release-pointer', operator: 'FBRI', from: payload.from, to: payload.to, resultId: id, observedAt: '2026-09-18T01:00:00Z' }))
    return dir
  }
  const dir = await publish()
  const plan = { schemaVersion: 1, kind: 'recorder-evidence-plan', producerId: 'recorder-minimax', validUntil: '2026-09-19T00:00:00Z', feeds: [{ feedId: 'uk-bus-archive', archive: { journalPath, closeoutPath, expectedEnd: '2026-09-18T00:00:00Z', deadlineAt: '2026-09-18T06:00:00Z' }, publication: { pointerPath, operator: 'FBRI', expectedThrough: '2026-09-17', deadlineAt: '2026-09-18T06:00:00Z' } }] }
  return { root, registry, report, record, plan, journal, payload, dir, publish, run: () => recorderEvidenceHealth(registry, report, plan), saveRecord: () => writeFile(closeoutPath, encode(record)) }
}
const stage = (report, id) => report.feeds[0].stages.find(s => s.stageId === id)

it('verifies recorder-native closeout provenance and immutable release bytes, without mutating inputs', async () => {
  const f = await fixture(), original = JSON.stringify(f.report), r = await f.run()
  expect(stage(r, 'archive').state).toBe('healthy')
  expect(stage(r, 'archive').metrics['recorded-upload-files']).toBe(4)
  expect(stage(r, 'publication').state).toBe('healthy')
  expect(stage(r, 'publication').timestamps.latestPeriodEnd).toBe('2026-09-17T23:00:00.000Z')
  expect(JSON.stringify(f.report)).toBe(original)
  expect(JSON.stringify(r)).not.toContain(f.root)
})
it('detects closeout hash mismatch, local-only completion, partial failures and false empty uploads', async () => {
  const f = await fixture()
  f.record.journalSha256 = '0'.repeat(64); await f.saveRecord()
  expect(stage(await f.run(), 'archive').reasons).toEqual(['archive-evidence-invalid'])
  f.record.journalSha256 = hash(encode(f.journal)); f.record.steps.upload = null; f.record.complete = true; await f.saveRecord()
  expect(stage(await f.run(), 'archive').reasons).toEqual(['archive-upload-overdue'])
  f.record.steps.upload = { '2026-09-17': { normalized: { failed: 1, error: 'private secret' } } }; await f.saveRecord()
  expect(stage(await f.run(), 'archive').reasons).toEqual(['archive-upload-failed'])
  expect(JSON.stringify(await f.run())).not.toContain('secret')
  f.record.steps.upload = { '2026-09-17': { normalized: { files: 0, uploaded: 0, skipped: 0, failed: 0 } } }; await f.saveRecord()
  expect(stage(await f.run(), 'archive').state).toBe('unknown')
})
it('requires all captured dates, normalized upload and bus publication evidence', async () => {
  const f = await fixture()
  delete f.record.steps.upload['2026-09-17'].publish; await f.saveRecord()
  expect(stage(await f.run(), 'archive').state).toBe('degraded')
  f.record.dates = []; await f.saveRecord()
  expect(stage(await f.run(), 'archive').state).toBe('unknown')
})
it('moves missing evidence from waiting to overdue at the explicit deadline', async () => {
  const f = await fixture()
  await rm(f.plan.feeds[0].archive.closeoutPath)
  f.plan.feeds[0].archive.deadlineAt = '2026-09-18T13:00:00Z'
  expect(stage(await f.run(), 'archive').state).toBe('waiting')
  f.plan.feeds[0].archive.deadlineAt = '2026-09-18T11:00:00Z'
  expect(stage(await f.run(), 'archive').reasons).toEqual(['archive-evidence-overdue'])
})
it('checks release hashes and identities instead of trusting a successful analytics job', async () => {
  const f = await fixture()
  await writeFile(join(f.dir, 'result.json'), '{"secret":"private-token"}')
  expect(stage(await f.run(), 'publication').reasons).toEqual(['publication-evidence-invalid'])
  expect(JSON.stringify(await f.run())).not.toContain('private-token')
})
it('detects a stale selected day even when pointer and artifact hashes agree', async () => {
  const f = await fixture()
  f.payload.days[0].status = 'stale'; await f.publish()
  expect(stage(await f.run(), 'publication').reasons).toEqual(['publication-day-overdue'])
  f.plan.feeds[0].publication.deadlineAt = '2026-09-18T13:00:00Z'
  expect(stage(await f.run(), 'publication').state).toBe('waiting')
})
it('does not confuse a historical release with the expected newer date', async () => {
  const f = await fixture()
  f.plan.feeds[0].publication.expectedThrough = '2026-09-18'
  f.plan.feeds[0].publication.deadlineAt = '2026-09-19T06:00:00Z'; f.plan.validUntil = '2026-09-19T12:00:00Z'
  expect(stage(await f.run(), 'publication').state).not.toBe('healthy')
})
it('rejects symlink evidence and invalid plans without exposing paths', async () => {
  const f = await fixture(), alias = join(f.root, 'alias.json')
  await symlink(f.plan.feeds[0].archive.closeoutPath, alias)
  f.plan.feeds[0].archive.closeoutPath = alias
  expect(stage(await f.run(), 'archive').state).toBe('unknown')
  f.plan.feeds.push(f.plan.feeds[0])
  await expect(f.run()).rejects.toThrow('Duplicate')
})
it('cannot use old artifacts to override unavailable producer telemetry or intentional pauses', async () => {
  const f = await fixture()
  const stale = recorderFeedHealth(f.registry, null, { producerId: 'recorder-minimax', now })
  const r = await recorderEvidenceHealth(f.registry, stale, f.plan)
  expect(r.feeds[0].stages.every(s => s.state === 'unknown')).toBe(true)
})
it('expires dated expectations so yesterday’s target cannot stay green indefinitely', async () => {
  const f = await fixture()
  f.plan.validUntil = '2026-09-18T11:00:00Z'
  expect(stage(await f.run(), 'archive').reasons).toEqual(['evidence-plan-expired'])
  expect(stage(await f.run(), 'publication').reasons).toEqual(['evidence-plan-expired'])
})
