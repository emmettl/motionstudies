// Bounded, manual research experiment. Does not enrol a recorder job or touch its stores.
import { mkdir, readFile, writeFile, statfs, readdir, stat, copyFile } from 'node:fs/promises'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { gzipSync, gunzipSync } from 'node:zlib'
import { performance } from 'node:perf_hooks'
import { capture, readCapture, sha256, atomicJson } from '../../packages/data/src/source-store.mjs'
import { decodeAdsbHeatmap, transportAirTracks } from '../../packages/data/src/adsb-heatmap.mjs'

export const DATE = '2026-09-14'
export const BOUNDS = [-25, 34, 45, 72] // Viewing window, not a political definition of Europe.
const SCRIPT = fileURLToPath(import.meta.url)
const ROOT = resolve(dirname(SCRIPT), '../../work/europe-air-proof', DATE)
const SOURCE = { id: 'adsblol', publisher: 'ADSB.lol', kind: 'observed-positions',
  documentation: 'https://www.adsb.lol/docs/open-data/historical/', license: 'ODbL-1.0',
  attribution: 'ADSB.lol and its contributors', origins: ['https://globe.adsb.lol'] }
const LAND = { id: 'natural-earth-land', publisher: 'Natural Earth', kind: 'land-context',
  documentation: 'https://www.naturalearthdata.com/about/terms-of-use/', license: 'Public domain',
  origins: ['https://raw.githubusercontent.com'] }
const LAND_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_110m_land.geojson'
const LAND_HASH = '9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9'
const MAX_SLICE = 64 * 1024 ** 2
const MAX_ROOT = 8 * 1024 ** 3
const STORE = join(ROOT, 'source-store')
const OUT = join(ROOT, 'review')
const urlFor = i => `https://globe.adsb.lol/globe_history/2026/09/14/heatmap/${String(i).padStart(2, '0')}.bin.ttf`
const expand = bytes => bytes[0] === 31 && bytes[1] === 139 ? gunzipSync(bytes, { maxOutputLength: MAX_SLICE }) : bytes
const window = (start, end) => ({ serviceDate: DATE, utcOffsetHours: 0, windowStart: start, windowEnd: end, bounds: BOUNDS })

async function treeBytes(path) {
  let result = 0
  for (const item of await readdir(path, { withFileTypes: true })) {
    const child = join(path, item.name)
    if (item.isSymbolicLink()) throw new Error('Research directory must not contain symlinks')
    result += item.isDirectory() ? await treeBytes(child) : (await stat(child)).size
  }
  return result
}
async function capacity(reserve = MAX_SLICE * 2) {
  const disk = await statfs(ROOT)
  if (disk.bavail * disk.bsize < 12 * 1024 ** 3 + reserve) throw new Error('Research free-space floor reached')
  if (await treeBytes(ROOT) + reserve > MAX_ROOT) throw new Error('Research 8 GiB directory budget reached')
}

// Inspect frame timestamps independently of accepted aircraft to distinguish an empty
// viewing window from an absent source interval. Geometry coverage remains unknown.
export function frameAudit(bytes) {
  if (!bytes.length || bytes.length % 16 !== 0) throw new Error('Malformed heatmap length')
  const frames = []
  for (let i = 0; i < bytes.length; i += 16) if (bytes.readUInt32LE(i) === 0x0e7f7c9d) {
    frames.push((Number((BigInt(bytes.readInt32LE(i + 4)) << 32n) | BigInt(bytes.readUInt32LE(i + 8))) - Date.parse(`${DATE}T00:00:00Z`)) / 1000)
  }
  if (!frames.length || frames.some((t, i) => !Number.isFinite(t) || t < 0 || t >= 86400 || (i && t <= frames[i - 1]))) throw new Error('Invalid or unordered source frames')
  return { first: frames[0], last: frames.at(-1), frames: frames.length, largestGap: Math.max(0, ...frames.slice(1).map((t, i) => t - frames[i])), times: frames }
}

export function distanceMetres(a, b) {
  const r = Math.PI / 180, dy = (b[2] - a[2]) * r, dx = (b[1] - a[1]) * r
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.sin(dy / 2) ** 2 + Math.cos(a[2] * r) * Math.cos(b[2] * r) * Math.sin(dx / 2) ** 2)))
}

// Reuse shared transport filtering, with explicit continuity barriers before it.
// Counts and IDs describe fragments in an hourly working window, not unique flights.
export function cleanTracks(records) {
  const counts = { duplicateSamples: 0, conflictingTimestamps: 0, gapsOver45Seconds: 0, implausibleJumps: 0, invalidSamples: 0 }
  const pieces = []
  for (const record of records) {
    const ordered = record.samples.sort((a, b) => a[0] - b[0])
    let group = []
    const flush = () => { if (group.length) pieces.push({ id: record.id, callsign: group.find(p => p[5])?.[5] ?? '', samples: group }); group = [] }
    for (let i = 0; i < ordered.length;) {
      const p = ordered[i], same = [p]; i++
      while (i < ordered.length && ordered[i][0] === p[0]) same.push(ordered[i++])
      if (same.some(q => q.slice(1).some((v, j) => v !== p[j + 1]))) { counts.conflictingTimestamps++; flush(); continue }
      counts.duplicateSamples += same.length - 1
      if (!p.slice(0, 5).every(Number.isFinite) || Math.abs(p[1]) > 180 || Math.abs(p[2]) > 90) { counts.invalidSamples++; flush(); continue }
      const prev = group.at(-1), gap = prev ? p[0] - prev[0] : 0
      if (prev && gap > 45) { counts.gapsOver45Seconds++; flush() }
      else if (prev && distanceMetres(prev, p) / gap > 1200 * 1852 / 3600) { counts.implausibleJumps++; flush() }
      group.push(p)
    }
    flush()
  }
  return { counts, tracks: transportAirTracks(pieces, { splitTracks: true }) }
}

async function acquire() {
  const started = performance.now(), records = [], frames = [], slices = []
  for (let i = 0; i < 48; i++) {
    await capacity()
    const result = await capture({ store: STORE, source: SOURCE, url: urlFor(i), maxBytes: MAX_SLICE,
      timeoutMs: 60000, retries: 1, compression: 'gzip', validate(bytes) {
        const audit = frameAudit(expand(bytes))
        if (audit.first < i * 1800 || audit.last >= (i + 1) * 1800) throw new Error('Source frame outside expected half-hour')
      } })
    const { times, ...audit } = frameAudit(expand(result.bytes)); frames.push(...times)
    records.push(result.record); slices.push({ slice: i, ...audit, bytes: result.record.bytes, storedBytes: result.record.storedBytes })
    console.log(JSON.stringify({ stage: 'capture', slice: i, cached: result.cached, bytes: result.record.bytes, frames: audit.frames }))
  }
  await capacity()
  const land = await capture({ store: STORE, source: LAND, url: LAND_URL, maxBytes: 2 * 1024 ** 2, retries: 1,
    compression: 'gzip', validate(bytes) { if (sha256(bytes) !== LAND_HASH) throw new Error('Pinned geography hash mismatch') } })
  await writeFile(join(OUT, 'land.geojson'), land.bytes)
  const unique = [...new Set(frames)].sort((a, b) => a - b)
  const report = { date: DATE, sourceRecords: records, geography: land.record, slices,
    sourceBytes: records.reduce((n, r) => n + r.bytes, 0), storedSourceBytes: records.reduce((n, r) => n + r.storedBytes, 0),
    elapsedSeconds: (performance.now() - started) / 1000,
    sourceFrames: { count: unique.length, first: unique[0], last: unique.at(-1), duplicateFrames: frames.length - unique.length,
      largestGapSeconds: Math.max(...unique.slice(1).map((t, i) => t - unique[i])),
      gapsOver10Seconds: unique.slice(1).flatMap((t, i) => t - unique[i] > 10 ? [[unique[i], t]] : []) },
    note: 'Frame continuity describes retained source slices, not completeness of aircraft reception.' }
  await atomicJson(join(ROOT, 'acquisition.json'), report)
}

async function compileHour(hour) {
  const started = performance.now(), records = new Map(), sourceHashes = []
  const start = hour * 3600, end = start + 3600, from = Math.max(0, start - 180), to = Math.min(86400, end + 45)
  let acceptedBeforeFiltering = 0
  for (let i = Math.floor(from / 1800); i <= Math.min(47, Math.floor(to / 1800)); i++) {
    const result = await readCapture(STORE, SOURCE, urlFor(i)); sourceHashes.push(result.record.sha256)
    decodeAdsbHeatmap(expand(result.bytes), window(from, to), (address, sample) => {
      if (sample[0] >= 86400) return
      const id = address.toString(16).padStart(6, '0'), record = records.get(id) ?? { id, samples: [] }
      sample[1] = Math.round(sample[1] * 1e5) / 1e5; sample[2] = Math.round(sample[2] * 1e5) / 1e5
      record.samples.push(sample); records.set(id, record); acceptedBeforeFiltering++
    })
  }
  const { counts, tracks } = cleanTracks(records.values())
  const bins = Array.from({ length: 12 }, (_, i) => ({ time: start + i * 300, observedSamples: 0, aircraftAtInstant: 0 }))
  const cells = new Map(), identities = new Set(), seen = new Set()
  let samples = 0, largestRetainedGap = 0
  for (const track of tracks) {
    for (let i = 0; i < track.samples.length; i++) {
      const p = track.samples[i]
      if (i) largestRetainedGap = Math.max(largestRetainedGap, p[0] - track.samples[i - 1][0])
      if (p[0] < start || p[0] >= end) continue
      const key = `${track.icaoAddress}:${p[0]}`
      if (seen.has(key)) throw new Error('Duplicate retained aircraft-time observation')
      seen.add(key); samples++; identities.add(track.icaoAddress)
      bins[Math.floor((p[0] - start) / 300)].observedSamples++
      const cell = `${Math.floor(p[1] * 2) / 2},${Math.floor(p[2] * 2) / 2}`
      cells.set(cell, (cells.get(cell) ?? 0) + 1)
    }
  }
  for (const bin of bins) {
    const ids = new Set()
    for (const track of tracks) {
      if (bin.time >= track.start && bin.time <= track.end) ids.add(track.icaoAddress)
    }
    bin.aircraftAtInstant = ids.size
  }
  const bytes = Buffer.from(JSON.stringify({ hour, windowStart: start, windowEnd: end, tracks }))
  const compressed = gzipSync(bytes, { level: 6 })
  if (compressed.length > 25 * 1024 ** 2) throw new Error('Hourly review chunk exceeds 25 MiB compressed')
  await capacity(bytes.length + compressed.length)
  const path = `hour-${String(hour).padStart(2, '0')}.json.gz`
  await writeFile(join(OUT, path), compressed)
  const report = { hour, path, sourceHashes, sha256: sha256(compressed), decodedSha256: sha256(bytes),
    bytes: compressed.length, decodedBytes: bytes.length, aircraftIdentities: [...identities].sort(),
    fragmentsIncludingOverlap: tracks.length, samplesExcludingOverlap: samples, acceptedBeforeFiltering,
    continuity: counts, largestRetainedGap, bins, cells: [...cells].map(([cell, count]) => [...cell.split(',').map(Number), count]),
    elapsedSeconds: (performance.now() - started) / 1000, maxRssKiB: process.resourceUsage().maxRSS }
  await atomicJson(join(ROOT, `hour-${hour}-audit.json`), report)
  console.log(JSON.stringify({ stage: 'compile', hour, samples, fragments: tracks.length, bytes: compressed.length, seconds: report.elapsedSeconds, rssMiB: report.maxRssKiB / 1024 }))
}

async function summarize() {
  const acquisition = JSON.parse(await readFile(join(ROOT, 'acquisition.json'), 'utf8'))
  const hours = await Promise.all(Array.from({ length: 24 }, (_, h) => readFile(join(ROOT, `hour-${h}-audit.json`), 'utf8').then(JSON.parse)))
  const ids = new Set(hours.flatMap(h => h.aircraftIdentities))
  const report = { schemaVersion: 1, date: DATE, timezone: 'UTC', bounds: BOUNDS,
    status: 'local research proof; not a production edition or recorder enrollment',
    source: { publisher: SOURCE.publisher, license: SOURCE.license, attribution: SOURCE.attribution, url: SOURCE.documentation },
    acquisition, aircraftIdentities: ids.size, samples: hours.reduce((n, h) => n + h.samplesExcludingOverlap, 0),
    delivery: { gzipBytes: hours.reduce((n, h) => n + h.bytes, 0), decodedBytes: hours.reduce((n, h) => n + h.decodedBytes, 0),
      largestGzipChunk: Math.max(...hours.map(h => h.bytes)), largestDecodedChunk: Math.max(...hours.map(h => h.decodedBytes)) },
    compilation: { seconds: hours.reduce((n, h) => n + h.elapsedSeconds, 0), peakChildRssKiB: Math.max(...hours.map(h => h.maxRssKiB)),
      method: 'Serial hourly child processes; 2 GiB JavaScript heap ceiling per child; RSS measured separately.' },
    method: { boundsMeaning: 'European viewing rectangle includes adjacent regions; not a Europe-only political mask.',
      filtering: 'Shared transport thresholds, applied separately to continuous hourly fragments. At least four distinct samples; 120 knots and 1500 feet; without airline-like callsign, 250 knots and 10000 feet.',
      continuity: 'Conflict timestamps excluded; gaps over 45 seconds, jumps over 1200 knots and known callsign changes split fragments. No interpolation across these barriers.',
      clock: 'UTC day, half-open [00:00,24:00); 180-second preceding / 45-second following overlap within the retained day.',
      metrics: 'Day aircraft count is a union of ICAO addresses, not flights. Samples/cells exclude hourly overlap. Snapshot count is distinct aircraft with a continuous fragment spanning each five-minute instant.',
      endpoints: 'No confirmed origins, destinations or arrival/departure counts. Observation density is not air-traffic completeness.' },
    limits: { directoryBytes: MAX_ROOT, requests: '48 source requests plus one pinned basemap, at most one retry each; cache reruns avoid downloads',
      sourceSliceBytes: MAX_SLICE, freeDiskFloorBytes: 12 * 1024 ** 3, host: 'author laptop; no mini writes, recorder config changes, uploads or scheduled jobs' },
    reproducibility: { node: process.version, platform: process.platform, arch: process.arch,
      scriptSha256: sha256(await readFile(SCRIPT)), decoderSha256: sha256(await readFile(resolve(dirname(SCRIPT), '../../packages/data/src/adsb-heatmap.mjs'))) },
    hours }
  for (const hour of hours) {
    const raw = await readFile(join(OUT, hour.path))
    if (sha256(raw) !== hour.sha256 || sha256(gunzipSync(raw)) !== hour.decodedSha256) throw new Error('Chunk hash mismatch')
    if (hour.cells.reduce((n, c) => n + c[2], 0) !== hour.samplesExcludingOverlap || hour.bins.reduce((n, b) => n + b.observedSamples, 0) !== hour.samplesExcludingOverlap) throw new Error('Aggregation does not reconcile')
    if (hour.largestRetainedGap > 45) throw new Error('Continuity regression')
  }
  await atomicJson(join(ROOT, 'report.json'), report)
  await atomicJson(join(OUT, 'manifest.json'), { ...report, hours: hours.map(({ aircraftIdentities: _ids, sourceHashes: _hashes, ...h }) => h) })
  await copyFile(resolve(dirname(SCRIPT), 'europe-air-review.html'), join(OUT, 'index.html'))
  console.log(JSON.stringify({ stage: 'complete', aircraft: ids.size, samples: report.samples, ...report.delivery, ...report.compilation }))
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const mode = process.argv[2]
  if (mode === 'acquire') await acquire()
  else if (mode === 'hour') {
    const hour = Number(process.argv[3]); if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('Expected hour 0–23')
    await compileHour(hour)
  } else if (mode === 'compile') {
    for (let h = 0; h < 24; h++) {
      await capacity(512 * 1024 ** 2)
      const child = spawnSync(process.execPath, ['--max-old-space-size=2048', SCRIPT, 'hour', String(h)], { stdio: 'inherit', timeout: 120000 })
      if (child.status !== 0) throw new Error(`Hour ${h} did not complete: ${child.error?.message ?? child.signal ?? child.status}`)
    }
    await summarize()
  } else if (mode === 'summarize') await summarize()
  else throw new Error('Usage: node scripts/research/europe-air-proof.mjs acquire|compile|summarize|hour N')
}
if (process.argv[1] && resolve(process.argv[1]) === SCRIPT) main().catch(error => { console.error(error); process.exitCode = 1 })
