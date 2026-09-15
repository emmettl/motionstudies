import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve, sep } from 'node:path'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: { manifest: { type: 'string' }, 'source-store': { type: 'string' } } })
if (!values.manifest) throw new Error('--manifest is required')
const manifest = JSON.parse(await readFile(values.manifest, 'utf8'))
assert.equal(manifest.kind, 'common-day-preparation')
const root = resolve(dirname(values.manifest))
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const artifacts = new Map()
for (const file of manifest.files) {
  const path = resolve(root, file.path)
  assert(path.startsWith(root + sep), 'Artifact must stay inside the release directory')
  const bytes = await readFile(path)
  assert.equal(bytes.length, file.bytes, file.path)
  assert.equal(digest(bytes), file.sha256, file.path)
  artifacts.set(file.path, JSON.parse(bytes))
}
const raw = new Map()
for (const source of artifacts.get('sources.json')) {
  assert.match(source.sha256, /^[a-f0-9]{64}$/)
  const bytes = await readFile(resolve(values['source-store'] ?? manifest.privateSourceStore, 'objects', source.sha256))
  assert.equal(bytes.length, source.bytes, source.url)
  assert.equal(digest(bytes), source.sha256, source.url)
  raw.set(source.sha256, bytes)
}
assert.equal(digest(await readFile(manifest.bus.releasePath)), manifest.bus.releaseSha256, 'Bus release changed')
const power = artifacts.get('power-context.json')
for (const section of [power.fuelMix, power.demand]) {
  const source = JSON.parse(raw.get(section.sourceSha256))
  for (const { sourceRow, ...row } of section.rows) assert.deepEqual(row, source.data[sourceRow])
}
assert.equal(artifacts.get('tide.json').samples.length, manifest.coverage.tideValid)
const air = artifacts.get('air.json')
assert.equal(air.tracks.length, manifest.coverage.airTracks)
assert.equal(air.tracks.reduce((n, track) => n + track.samples.length, 0), manifest.coverage.airSamples)
console.log(`Verified ${manifest.date}: ${artifacts.size} artifacts, ${raw.size} raw captures, bus release and all power source rows.`)
