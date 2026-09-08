import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { parseCsvLine } from './gtfs.mjs'

export function parseAirports(csv) {
  const [header, ...lines] = csv.trim().split(/\r?\n/)
  const keys = parseCsvLine(header)
  return lines.map(line => Object.fromEntries(parseCsvLine(line).map((value, index) => [keys[index], value])))
    .filter(row => ['large_airport', 'medium_airport'].includes(row.type) && row.ident && row.elevation_ft)
    .map(row => ({ icao: row.ident, iata: row.iata_code, name: row.name, city: row.municipality,
      longitude: Number(row.longitude_deg), latitude: Number(row.latitude_deg), elevation: Number(row.elevation_ft) }))
    .filter(row => [row.longitude, row.latitude, row.elevation].every(Number.isFinite))
}

function distance(sample, airport) {
  const longitude = ((sample[1] - airport.longitude + 540) % 360) - 180
  return Math.hypot(longitude * 111.32 * Math.cos((sample[2] + airport.latitude) * Math.PI / 360), (sample[2] - airport.latitude) * 111.32)
}

function atAirport(sample, airport) {
  return sample[3] >= airport.elevation - 500 && sample[3] <= airport.elevation + 1500 && sample[4] <= 250 && distance(sample, airport) <= 6
}

/** Conservative endpoint association; cruise-only traces and ambiguous neighbouring airports stay unknown. */
export function inferAirEndpoints(samples, airports) {
  if (samples.length < 4) return {}
  const maximumAltitude = Math.max(...samples.map(sample => sample[3]))
  const endpoint = (arrival) => {
    const ordered = arrival ? [...samples].reverse() : samples
    const candidates = airports.filter(airport => atAirport(ordered[0], airport) && maximumAltitude >= airport.elevation + 3000)
    if (candidates.length !== 1) return undefined
    const airport = candidates[0]
    let boundary = ordered[0]
    for (const sample of ordered.slice(1)) {
      if (!atAirport(sample, airport)) break
      boundary = sample
    }
    return { icao: airport.icao, iata: airport.iata, name: airport.name, city: airport.city, time: boundary[0], evidence: 'observed-endpoint' }
  }
  const origin = endpoint(false), destination = endpoint(true)
  if (origin && destination && (origin.icao === destination.icao || origin.time >= destination.time)) return {}
  return { ...(origin ? { origin } : {}), ...(destination ? { destination } : {}) }
}

function segmentsFor(samples) {
  const segments = []
  let current = []
  for (const sample of samples.sort((a, b) => a[0] - b[0])) {
    const previous = current.at(-1)
    if (previous && previous[0] === sample[0]) continue
    if (previous && (sample[0] - previous[0] > 1800 || sample[5] !== previous[5])) {
      segments.push(current)
      current = []
    }
    current.push(sample)
  }
  if (current.length) segments.push(current)
  return segments
}

/** Enrich an existing study and its chunks using cached, same-date global heatmaps. No network requests. */
export async function enrichAirEndpoints({ manifestPath, snapshotPaths = [], heatmapDirectory, airportCsvPath, utcOffsetHours }) {
  const readJson = async path => JSON.parse(await readFile(path, 'utf8'))
  const manifest = await readJson(manifestPath)
  const snapshots = await Promise.all(snapshotPaths.map(readJson))
  const date = manifest.metadata.serviceDate
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(utcOffsetHours)) throw new Error('A service date and UTC offset are required')
  if (snapshots.some(snapshot => snapshot.metadata.serviceDate !== date)) throw new Error('Air snapshots must share the manifest service date')
  const tracks = [...manifest.aircraft, ...snapshots.flatMap(snapshot => snapshot.tracks)]
  const wanted = new Set(tracks.map(track => parseInt(track.icaoAddress ?? track.id.split('-')[0], 16)))
  const records = new Map()
  const dayStart = Date.parse(`${date}T00:00:00Z`) - utcOffsetHours * 3600000
  const files = (await readdir(heatmapDirectory)).filter(file => file.endsWith('.bin.ttf')).sort()
  if (!files.length) throw new Error('No cached heatmap slices found')
  const sources = []
  for (const file of files) {
    const raw = await readFile(join(heatmapDirectory, file))
    const buffer = gunzipSync(raw)
    let time
    const callsigns = new Map()
    let used = false
    for (let offset = 0; offset + 16 <= buffer.length; offset += 16) {
      const address = buffer.readUInt32LE(offset), latitude = buffer.readInt32LE(offset + 4)
      if (address === 0x0e7f7c9d) {
        time = Math.round((Number((BigInt(latitude) << 32n) | BigInt(buffer.readUInt32LE(offset + 8))) - dayStart) / 1000)
        continue
      }
      const id = address & 0xffffff
      if (!wanted.has(id) || (address & 0x01000000)) continue
      if ((latitude & 0x40000000) !== 0) {
        callsigns.set(id, buffer.subarray(offset + 8, offset + 16).toString('ascii').replaceAll('\0', '').trim().toUpperCase())
        continue
      }
      if (time === undefined || time < 0 || time > 86400) continue
      const altitude = buffer.readInt16LE(offset + 12), speed = buffer.readInt16LE(offset + 14)
      if (altitude < 0 || speed < 0) continue
      const samples = records.get(id) ?? []
      samples.push([time, buffer.readInt32LE(offset + 8) / 1e6, latitude / 1e6, altitude * 25, speed / 10, callsigns.get(id) ?? samples.at(-1)?.[5] ?? ''])
      records.set(id, samples)
      used = true
    }
    if (used) sources.push({ file, sha256: createHash('sha256').update(raw).digest('hex') })
  }
  const csv = await readFile(airportCsvPath, 'utf8')
  if (!sources.length) throw new Error('No same-date observations matched the study aircraft')
  const airports = parseAirports(csv)
  if (!airports.length) throw new Error('No usable airports in the reference CSV')
  const segments = new Map([...records].map(([id, samples]) => [id, segmentsFor(samples).map(samples => ({
    start: samples[0][0], end: samples.at(-1)[0], callsign: samples[0][5], ...inferAirEndpoints(samples, airports),
  }))]))
  const enrich = (track) => {
    const candidates = (segments.get(parseInt(track.icaoAddress ?? track.id.split('-')[0], 16)) ?? [])
      .filter(segment => segment.callsign && segment.callsign === track.callsign && segment.start <= track.start + 30 && segment.end >= track.end - 30)
    const { origin: _origin, destination: _destination, ...rest } = track
    if (candidates.length !== 1) return rest
    const { origin, destination } = candidates[0]
    return { ...rest, ...(origin ? { origin } : {}), ...(destination ? { destination } : {}) }
  }
  const metadata = {
    serviceDate: date, method: 'observed-endpoint', note: 'Origin/destination inferred from full-trace endpoints within 6 km and 1500 ft above an airport; observed times, not schedules or confirmed flight plans.',
    airportSource: 'https://ourairports.com/data/', airportLicense: 'Public Domain', airportSha256: createHash('sha256').update(csv).digest('hex'),
    traceSource: manifest.metadata.sourceUrl, traceLicense: 'ODbL 1.0', utcOffsetHours, sourceFiles: sources,
  }
  const aircraft = manifest.aircraft.map(enrich)
  const byId = new Map(aircraft.map(track => [track.id, track]))
  const writes = []
  for (const descriptor of manifest.chunks) {
    const path = join(dirname(manifestPath), descriptor.path)
    const chunk = await readJson(path)
    chunk.tracks = chunk.tracks.map(track => {
      const { origin: _origin, destination: _destination, ...rest } = track
      const full = byId.get(track.id)
      return { ...rest, ...(full?.origin ? { origin: full.origin } : {}), ...(full?.destination ? { destination: full.destination } : {}) }
    })
    writes.push([path, chunk])
  }
  writes.push([manifestPath, { ...manifest, metadata: { ...manifest.metadata, routeEnrichment: metadata }, aircraft }])
  snapshots.forEach((snapshot, index) => writes.push([snapshotPaths[index], { ...snapshot, metadata: { ...snapshot.metadata, routeEnrichment: metadata }, tracks: snapshot.tracks.map(enrich) }]))
  for (const [path, value] of writes) await writeFile(path, `${JSON.stringify(value)}\n`)
  return { tracks: aircraft.length, origins: aircraft.filter(track => track.origin).length, destinations: aircraft.filter(track => track.destination).length }
}
