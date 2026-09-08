import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { enrichAirEndpoints, inferAirEndpoints, parseAirports } from './air-endpoints.mjs'

const airports = [
  { icao: 'AAAA', iata: 'AAA', name: 'West Field', city: 'West', longitude: 0, latitude: 0, elevation: 0 },
  { icao: 'BBBB', iata: 'BBB', name: 'East Field', city: 'East', longitude: 2, latitude: 0, elevation: 0 },
]
const samples = [[0, 0, 0, 100, 120], [10, .01, 0, 600, 150], [20, .5, 0, 6000, 300], [30, 1.5, 0, 5000, 300], [40, 1.99, 0, 500, 150], [50, 2, 0, 100, 120]]

describe('observed air endpoints', () => {
  it('uses low approach boundaries for times and labels both endpoints as inferred evidence', () => {
    const result = inferAirEndpoints(samples, airports)
    expect(result.origin).toMatchObject({ icao: 'AAAA', time: 10, evidence: 'observed-endpoint' })
    expect(result.destination).toMatchObject({ icao: 'BBBB', time: 40, evidence: 'observed-endpoint' })
  })
  it('does not turn a regional cruise boundary into a destination', () => {
    expect(inferAirEndpoints(samples.slice(0, 4), airports).destination).toBeUndefined()
    expect(inferAirEndpoints(samples.slice(2), airports).origin).toBeUndefined()
    expect(inferAirEndpoints(samples.map(row => [row[0], row[1], row[2], 30000, 450]), airports)).toEqual({})
  })
  it('rejects ambiguous airports and ground-only movement', () => {
    expect(inferAirEndpoints(samples, [...airports, { ...airports[1], icao: 'CCCC', longitude: 2.01 }]).destination).toBeUndefined()
    expect(inferAirEndpoints(samples.map(row => [row[0], row[1], row[2], 100, 20]), airports)).toEqual({})
  })
  it('reads quoted names and excludes closed airports', () => {
    expect(parseAirports('ident,type,name,latitude_deg,longitude_deg,elevation_ft,iata_code,municipality\nAAAA,large_airport,"West, Field",0,0,50,AAA,West\nBBBB,closed,Closed,1,1,20,BBB,East\n')).toEqual([{ ...airports[0], name: 'West, Field', elevation: 50 }])
  })
})


it('enriches an archived southern-hemisphere flight and refreshes chunk integrity metadata', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'air-endpoint-test-'))
  try {
    const heatmaps = join(directory, 'heatmaps')
    await mkdir(heatmaps)
    const csvPath = join(directory, 'airports.csv')
    await writeFile(csvPath, 'ident,type,name,latitude_deg,longitude_deg,elevation_ft,iata_code,municipality\nAAAA,large_airport,West,-1,0,50,AAA,West\nBBBB,large_airport,East,-1,2,50,BBB,East\n')
    const records = []
    const address = 0xabc123
    const callsign = Buffer.alloc(16)
    callsign.writeUInt32LE(address); callsign.writeInt32LE(0x40000000, 4); callsign.write('TEST123', 8)
    records.push(callsign)
    for (const [seconds, longitude, , altitude, speed] of samples) {
      const clock = Buffer.alloc(16), position = Buffer.alloc(16)
      const milliseconds = BigInt(Date.parse('2026-09-04T00:00:00Z') + seconds * 1000)
      clock.writeUInt32LE(0x0e7f7c9d); clock.writeInt32LE(Number(milliseconds >> 32n), 4); clock.writeUInt32LE(Number(milliseconds & 0xffffffffn), 8)
      position.writeUInt32LE(address); position.writeInt32LE(-1000000, 4); position.writeInt32LE(longitude * 1000000, 8)
      position.writeInt16LE(altitude / 25, 12); position.writeInt16LE(speed * 10, 14)
      records.push(clock, position)
    }
    await writeFile(join(heatmaps, 'slice.bin.ttf'), gzipSync(Buffer.concat(records)))
    const track = { id: 'abc123-1', icaoAddress: 'abc123', callsign: 'TEST123', start: 3600, end: 3650 }
    const manifestPath = join(directory, 'manifest.json'), chunkPath = join(directory, 'chunk.json')
    await writeFile(manifestPath, JSON.stringify({ metadata: { serviceDate: '2026-09-04' }, aircraft: [track], chunks: [{ path: 'chunk.json', bytes: 0, sha256: 'stale' }] }))
    await writeFile(chunkPath, JSON.stringify({ tracks: [{ ...track, samples: [] }] }))
    expect(await enrichAirEndpoints({ manifestPath, heatmapDirectory: heatmaps, airportCsvPath: csvPath, utcOffsetHours: 1 })).toEqual({ tracks: 1, origins: 1, destinations: 1 })
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')), bytes = await readFile(chunkPath)
    expect(manifest.aircraft[0].destination).toMatchObject({ icao: 'BBBB', time: 3640 })
    expect(JSON.parse(bytes).tracks[0].destination).toEqual(manifest.aircraft[0].destination)
    expect(manifest.chunks[0].bytes).toBe(bytes.length)
    expect(manifest.chunks[0].sha256).toBe(createHash('sha256').update(bytes).digest('hex'))
  } finally { await rm(directory, { recursive: true, force: true }) }
})
