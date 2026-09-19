import { createHash } from 'node:crypto'
import { parseArgs } from 'node:util'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, mkdtemp, writeFile, rename, rm } from 'node:fs/promises'
import { join, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readOperationalFile } from '../packages/data/src/operational-files.mjs'
import { dailyFeedExpectation } from '../packages/data/src/feed-expectations.mjs'
const exec = promisify(execFile)
const script = name => fileURLToPath(new URL(name, import.meta.url))
let config, temporary
const save = async (name, value) => {
  const path = join(temporary, name)
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
  await rename(path, join(config.stateRoot, name))
}
try {
  const { values } = parseArgs({ options: { config: { type: 'string' } } })
  config = JSON.parse(await readOperationalFile(values.config, 65536))
  for (const key of ['registry', 'status', 'credentials', 'stateRoot']) if (!isAbsolute(config[key])) throw new Error('Absolute path required')
  await mkdir(config.stateRoot, { recursive: true, mode: 0o700 })
  temporary = await mkdtemp(join(config.stateRoot, '.export-'))
  const credentials = JSON.parse(await readOperationalFile(config.credentials, 4096))
  const args = [script('feed-health.mjs'), '--registry', config.registry, '--status', config.status, '--producer', config.producer, '--incidents', join(config.stateRoot, 'incidents')]
  if (config.publication) {
    const p = config.publication, expected = dailyFeedExpectation(p)
    const from = p.from > `${expected.serviceDate.slice(0, 7)}-01` ? p.from : `${expected.serviceDate.slice(0, 7)}-01`
    const key = createHash('sha256').update(JSON.stringify({ operator: p.operator, from, to: expected.serviceDate })).digest('hex')
    const pointerPath = join(p.root, expected.serviceDate.slice(0, 7), 'quality-release-pointers', `${key}.json`)
    const plan = { schemaVersion: 1, kind: 'recorder-evidence-plan', producerId: config.producer, validUntil: expected.nextDeadlineAt,
      feeds: [{ feedId: p.feedId, publication: { pointerPath, operator: p.operator, expectedThrough: expected.serviceDate, deadlineAt: expected.deadlineAt } }] }
    const path = join(temporary, 'evidence.json')
    await writeFile(path, JSON.stringify(plan), { mode: 0o600 }); args.push('--evidence', path)
  }
  let result, healthExitCode = 0
  try { result = await exec(process.execPath, args, { timeout: 30000, maxBuffer: 128 * 1024 }) }
  catch (e) { if (e.code !== 2) throw new Error('Projection failed'); result = e; healthExitCode = 2 }
  const reportPath = join(temporary, 'health.json'), report = JSON.parse(result.stdout)
  await writeFile(reportPath, JSON.stringify(report), { mode: 0o600 })
  await exec(process.execPath, [script('push-feed-health.mjs'), '--registry', config.registry, '--report', reportPath, '--url', config.url], {
    timeout: 15000, maxBuffer: 4096, env: { ...process.env, FEED_PUSH_TOKEN: credentials.pushToken, CF_ACCESS_CLIENT_ID: credentials.accessClientId, CF_ACCESS_CLIENT_SECRET: credentials.accessClientSecret },
  })
  await save('last-report.json', report)
  await save('export-status.json', { schemaVersion: 1, completedAt: new Date().toISOString(), state: 'submitted', healthExitCode, producerGeneratedAt: report.producerGeneratedAt })
} catch {
  if (temporary) await save('export-status.json', { schemaVersion: 1, completedAt: new Date().toISOString(), state: 'failed' }).catch(() => {})
  process.exitCode = 1
} finally {
  if (temporary) await rm(temporary, { recursive: true, force: true })
}
