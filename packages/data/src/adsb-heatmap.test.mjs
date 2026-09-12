import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chunkAirSnapshot, decodeAdsbHeatmap, ingestAdsbHeatmaps, transportAirTracks } from './adsb-heatmap.mjs'

const options = { serviceDate: '2026-09-04', utcOffsetHours: 2, windowStart: 0, windowEnd: 90000, bounds: [-5, -5, 5, 5] }
const dayStart = Date.parse('2026-09-03T22:00:00Z')
function clock(seconds) {
  const buffer = Buffer.alloc(16), time = BigInt(dayStart + seconds * 1000)
  buffer.writeUInt32LE(0x0e7f7c9d); buffer.writeInt32LE(Number(time >> 32n), 4); buffer.writeUInt32LE(Number(time & 0xffffffffn), 8)
  return buffer
}
function callsign(text, address = 0xabc123) {
  const buffer = Buffer.alloc(16)
  buffer.writeUInt32LE(address); buffer.writeInt32LE(0x40000000, 4); buffer.write(text, 8, 8, 'ascii')
  return buffer
}
function position({ address = 0xabc123, longitude = 1.123456, latitude = -1.123456, altitude = 6000, speed = 200 } = {}) {
  const buffer = Buffer.alloc(16)
  buffer.writeUInt32LE(address); buffer.writeInt32LE(Math.round(latitude * 1e6), 4); buffer.writeInt32LE(Math.round(longitude * 1e6), 8)
  buffer.writeInt16LE(altitude / 25, 12); buffer.writeInt16LE(speed * 10, 14)
  return buffer
}
function decode(parts, overrides = {}) {
  const observations = []
  const count = decodeAdsbHeatmap(Buffer.concat(parts), { ...options, ...overrides }, (id, sample) => observations.push({ id, sample }))
  expect(count).toBe(observations.length)
  return observations
}
function samples(start, name = 'TEST123', speed = 200, altitude = 6000) {
  return [0, 10, 20, 30].map(offset => [start + offset, 1, 1, altitude, speed, name])
}

describe('shared heatmap decoding', () => {
  it('decodes southern positions and keeps service-local midnight and >24h timestamps', () => {
    expect(decode([callsign(' test12 '), position(), clock(0), position(), clock(86410), position()])).toEqual([
      { id: 0xabc123, sample: [0, 1.123456, -1.123456, 6000, 200, 'TEST12'] },
      { id: 0xabc123, sample: [86410, 1.123456, -1.123456, 6000, 200, 'TEST12'] },
    ])
  })
  it('filters geographic/time bounds, ground signals, invalid speeds and non-ICAO addresses', () => {
    expect(decode([
      callsign('RIGHT'), callsign('WRONG', 0x1abc123), clock(0), position(),
      clock(10), position({ latitude: 6 }), position({ altitude: -25 }), position({ speed: -0.1 }),
      position({ address: 0x1abc123 }), position({ address: 0x123456 }), position(),
      clock(20), position(), clock(21), position(),
    ], { windowStart: 10, windowEnd: 20, addresses: new Set([0xabc123]) })).toEqual([
      { id: 0xabc123, sample: [10, 1.123456, -1.123456, 6000, 200, 'RIGHT'] },
      { id: 0xabc123, sample: [20, 1.123456, -1.123456, 6000, 200, 'RIGHT'] },
    ])
  })
  it('distinguishes an absent callsign from an explicitly cleared one', () => {
    expect(decode([clock(0), position(), callsign(''), clock(10), position()]).map(row => row.sample[5])).toEqual([undefined, ''])
  })
  it('rejects truncated input and invalid dates, offsets, windows and bounds', () => {
    expect(() => decodeAdsbHeatmap(Buffer.alloc(15), options, () => {})).toThrow('Truncated')
    for (const overrides of [
      { serviceDate: '2026-02-30' }, { utcOffsetHours: NaN }, { windowEnd: Infinity },
      { windowStart: 10, windowEnd: 10 }, { bounds: [5, -5, -5, 5] }, { bounds: [-5, -91, 5, 5] },
    ]) expect(() => decode([], overrides)).toThrow()
  })
})

describe('shared transport tracks', () => {
  it('preserves deterministic IDs, deduplicates overlapping input and splits callsign changes and gaps', () => {
    const record = { id: 'abc123', callsign: 'TEST456', samples: [
      ...samples(100, 'TEST123'), ...samples(200, 'TEST456'), ...samples(3000, 'TEST456'),
      [100, 99, 99, 6000, 200, 'TEST123'],
    ].reverse() }
    const before = structuredClone(record)
    const tracks = transportAirTracks([record])
    expect(tracks.map(track => [track.id, track.icaoAddress, track.callsign, track.samples.length])).toEqual([
      ['abc123-100', 'abc123', 'TEST123', 4], ['abc123-200', 'abc123', 'TEST456', 4], ['abc123-3000', 'abc123', 'TEST456', 4],
    ])
    expect(tracks[0].samples[0]).toEqual([100, 99, 99, 6000, 200])
    expect(record).toEqual(before)
    const legacy = transportAirTracks([record], { splitTracks: false })
    expect(legacy).toHaveLength(1)
    expect(legacy[0]).toMatchObject({ id: 'abc123', start: 100, end: 3030 })
  })
  it('keeps the editions’ transport thresholds and does not drop fast unnamed aircraft', () => {
    const records = [
      { id: '000001', callsign: 'TEST1', samples: samples(0, 'TEST1', 119) },
      { id: '000002', callsign: 'TEST2', samples: samples(0, 'TEST2', 200, 1475) },
      { id: '000003', callsign: 'TEST3', samples: samples(0, 'TEST3').slice(0, 3) },
      { id: '000004', callsign: 'PRIVATE', samples: samples(0, 'PRIVATE', 249, 10000) },
      { id: '000005', callsign: '', samples: samples(0, '', 250, 10000) },
      { id: '000006', callsign: 'TEST6', samples: samples(0, 'TEST6', 120, 1500) },
    ]
    expect(transportAirTracks(records).map(track => track.callsign)).toEqual(['000005', 'TEST6'])
  })
})

it('retains chunk overlaps, full-flight bounds, endpoint evidence and exact payload hashes', () => {
  const track = { id: 'abc123-3590', icaoAddress: 'abc123', callsign: 'TEST123', start: 3590, end: 3650,
    origin: { icao: 'AAAA', time: 3590, evidence: 'observed-endpoint' },
    samples: [3590, 3600, 3645, 3650].map(time => [time, 1, 1, 6000, 200]) }
  const snapshot = { metadata: { windowStart: 0, windowEnd: 7201 }, bounds: {}, tracks: [track] }
  const { manifest, chunks } = chunkAirSnapshot(snapshot, { chunkSeconds: 3600, stem: 'sample-air' })
  expect(chunks.map(chunk => chunk.descriptor.path)).toEqual(['sample-air-00.json', 'sample-air-01.json', 'sample-air-02.json'])
  expect(chunks[0].payload.tracks[0]).toMatchObject({ start: 3590, end: 3645, origin: track.origin })
  expect(chunks[1].payload.tracks[0].samples).toEqual(track.samples)
  expect(chunks[2].payload).toEqual({ windowStart: 7200, windowEnd: 7201, tracks: [] })
  expect(manifest.aircraft[0]).toMatchObject({ start: 3590, end: 3650, chunkIds: ['00', '01'], origin: track.origin })
  expect(manifest.aircraft[0].samples).toBeUndefined()
  for (const { descriptor, payload } of chunks) {
    const bytes = Buffer.from(`${JSON.stringify(payload)}\n`)
    expect(descriptor.bytes).toBe(bytes.length)
    expect(descriptor.sha256).toBe(createHash('sha256').update(bytes).digest('hex'))
  }
  expect(() => chunkAirSnapshot(snapshot, { chunkSeconds: 0, stem: 'x' })).toThrow()
  expect(() => chunkAirSnapshot(snapshot, { chunkSeconds: 3600, stem: '../x' })).toThrow()
})

it('compiles gzip files into snapshots and indexed chunks with source provenance and stable cross-slice callsigns', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'heatmap-ingest-'))
  try {
    const inputs = [join(directory, '2026-09-03-23.bin.ttf'), join(directory, '2026-09-04-00.bin.ttf')]
    const raw = gzipSync(Buffer.concat([callsign('TEST123'), clock(3590), position(), clock(3600), position()]))
    await writeFile(inputs[0], raw)
    await writeFile(inputs[1], gzipSync(Buffer.concat([clock(3610), position(), clock(3620), position()])))
    const output = join(directory, 'sample-air-manifest.json')
    const manifest = await ingestAdsbHeatmaps({ ...options, windowEnd: 7200, inputs, output, chunkHours: 1, timezone: 'Etc/GMT-2' })
    expect(manifest).toEqual(JSON.parse(await readFile(output, 'utf8')))
    expect(manifest.metadata.sourceFiles[0]).toEqual({ name: '2026-09-03-23.bin.ttf', sha256: createHash('sha256').update(raw).digest('hex'), sourceUrl: 'https://github.com/adsblol/globe_history_2026/releases/tag/v2026.09.03-planes-readsb-prod-0' })
    expect(manifest.trackCount).toBe(1)
    expect(manifest.sampleCount).toBe(4)
    for (const descriptor of manifest.chunks) {
      const bytes = await readFile(join(directory, descriptor.path))
      expect(descriptor.bytes).toBe(bytes.length)
      expect(descriptor.sha256).toBe(createHash('sha256').update(bytes).digest('hex'))
      expect(JSON.parse(bytes).tracks[0]).toMatchObject({ id: 'abc123-3590', callsign: 'TEST123', start: 3590, end: 3620 })
    }
    const snapshot = await ingestAdsbHeatmaps({ ...options, inputs, output: join(directory, 'opening.json'), splitTracks: false })
    expect(snapshot.tracks[0]).toMatchObject({ id: 'abc123', callsign: 'TEST123', samples: [[3590, 1.12346, -1.12346, 6000, 200], [3600, 1.12346, -1.12346, 6000, 200], [3610, 1.12346, -1.12346, 6000, 200], [3620, 1.12346, -1.12346, 6000, 200]] })
  } finally { await rm(directory, { recursive: true, force: true }) }
})
