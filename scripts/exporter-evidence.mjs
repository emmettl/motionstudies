import { createHash } from 'node:crypto'
import { join, isAbsolute } from 'node:path'
import { readOperationalFile } from '../packages/data/src/operational-files.mjs'
import { dailyFeedExpectation } from '../packages/data/src/feed-expectations.mjs'
import { planRecorderEvidence } from './feed-evidence-plan.mjs'

/** The exporter's evidence plan for this invocation: the deadline-driven publication target and, when configured, each feed's archive target for its previous civil day. Null when neither is configured or found. */
export async function exporterEvidencePlan(config, { now = Date.now() } = {}) {
  const feeds = new Map()
  let validUntil = null
  if (config.publication) {
    const p = config.publication, expected = dailyFeedExpectation(p, now)
    const from = p.from > `${expected.serviceDate.slice(0, 7)}-01` ? p.from : `${expected.serviceDate.slice(0, 7)}-01`
    const key = createHash('sha256').update(JSON.stringify({ operator: p.operator, from, to: expected.serviceDate })).digest('hex')
    const pointerPath = join(p.root, expected.serviceDate.slice(0, 7), 'quality-release-pointers', `${key}.json`)
    feeds.set(p.feedId, { feedId: p.feedId, publication: { pointerPath, operator: p.operator, expectedThrough: expected.serviceDate, deadlineAt: expected.deadlineAt } })
    validUntil = expected.nextDeadlineAt
  }
  if (config.archive) {
    // Yesterday's closed journal and close-out per feed, selected from the recorder's own files. Only archive targets
    // are taken: publication keeps the deadline-driven selection above. A day without a matching journal is left out
    // (its archive stage stays unknown) rather than guessed.
    if (!isAbsolute(config.archive.hostConfig ?? '')) throw new Error('Absolute path required')
    try {
      const { plan: archive } = await planRecorderEvidence({ registry: JSON.parse(await readOperationalFile(config.registry, 256 * 1024)), producerId: config.producer,
        host: JSON.parse(await readOperationalFile(config.archive.hostConfig, 256 * 1024)), graceHours: config.archive.graceHours ?? 6, now })
      for (const f of archive.feeds) if (f.archive) feeds.set(f.feedId, { ...feeds.get(f.feedId), feedId: f.feedId, archive: f.archive })
      if (archive.feeds.some(f => f.archive) && (!validUntil || archive.validUntil > validUntil)) validUntil = archive.validUntil
    } catch (e) { if (e.message !== 'No evidence could be selected for this day') throw e }
  }
  return feeds.size ? { schemaVersion: 1, kind: 'recorder-evidence-plan', producerId: config.producer, validUntil, feeds: [...feeds.values()] } : null
}
