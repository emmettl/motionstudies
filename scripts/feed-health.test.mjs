import { it, expect, onTestFinished } from 'vitest'
import { mkdtemp, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('./feed-health.mjs', import.meta.url))
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'feed-health-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  const registry = JSON.parse(await readFile(new URL('../config/feeds/recorder.example.json', import.meta.url)))
  registry.feeds = [registry.feeds[0]]
  registry.feeds[0].stages = [registry.feeds[0].stages[0]]
  const registryPath = join(root, 'registry.json'), statusPath = join(root, 'status.json')
  await writeFile(registryPath, JSON.stringify(registry))
  return { root, registryPath, statusPath, run: () => spawnSync(process.execPath, [cli, '--registry', registryPath, '--producer', 'recorder-minimax', '--status', statusPath], { encoding: 'utf8' }) }
}
function healthy() {
  const stamp = new Date().toISOString()
  return { generatedAt: stamp, feeds: [{ name: 'bus-day', source: 'bulk-archive', state: 'healthy', lastCaptureAt: stamp }], disk: { freeBytes: 1000 }, capacity: { status: 'open', remainingCaptureBytes: 500 } }
}

it('CLI emits JSON and distinct exit codes for healthy, stale and missing status', async () => {
  const f = await fixture()
  await writeFile(f.statusPath, JSON.stringify(healthy()))
  const original = await readFile(f.statusPath, 'utf8'), ok = f.run()
  expect(ok.status).toBe(0)
  expect(JSON.parse(ok.stdout).feeds[0].state).toBe('healthy')
  expect(await readFile(f.statusPath, 'utf8')).toBe(original)
  const old = healthy(); old.generatedAt = '2020-01-01T00:00:00Z'
  await writeFile(f.statusPath, JSON.stringify(old))
  const stale = f.run()
  expect(stale.status).toBe(2)
  expect(JSON.parse(stale.stdout).telemetry.state).toBe('stale')
  await rm(f.statusPath)
  const missing = f.run()
  expect(missing.status).toBe(2)
  expect(JSON.parse(missing.stdout).telemetry.state).toBe('missing')
})

it('CLI rejects corrupt or oversized input without exposing input content or filesystem paths', async () => {
  const f = await fixture()
  for (const content of ['{ "token": "private-secret", broken }', ' '.repeat(4 * 1024 * 1024 + 1)]) {
    await writeFile(f.statusPath, content)
    const result = f.run()
    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).not.toContain('private-secret')
    expect(result.stderr).not.toContain(f.root)
  }
})

it('CLI exposes unknown archive coverage instead of reporting a clean end-to-end result', async () => {
  const f = await fixture(), registry = JSON.parse(await readFile(f.registryPath))
  registry.feeds[0].stages.push({ id: 'archive', dependsOn: ['capture'], maxAgeSeconds: null })
  await writeFile(f.registryPath, JSON.stringify(registry))
  await writeFile(f.statusPath, JSON.stringify(healthy()))
  const result = f.run()
  expect(result.status).toBe(2)
  expect(JSON.parse(result.stdout).feeds[0].stages[1].reasons).toEqual(['upload-evidence-unavailable'])
})
