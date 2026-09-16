// Offline endpoint coverage audit. Does not infer a route from heading or a map edge.
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { parseCsvLine } from '../../packages/data/src/gtfs.mjs'
const [releasePath, outputPath] = process.argv.slice(2)
if (!releasePath || !outputPath) throw new Error('Usage: node scripts/research/audit-luft-continents.mjs RELEASE_DIRECTORY OUTPUT_JSON')
const root = resolve(releasePath), digest = bytes => createHash('sha256').update(bytes).digest('hex')
const manifestBytes = await readFile(join(root, 'manifest.json')), manifest = JSON.parse(manifestBytes)
if (manifest.kind !== 'air-day-release' || manifest.schemaVersion !== 1) throw new Error('Unsupported air release')
const readVerified = async descriptor => {
  if (!descriptor || !/^[a-zA-Z0-9._-]+$/.test(descriptor.path)) throw new Error('Invalid release descriptor')
  const bytes = await readFile(join(root, descriptor.path))
  if (bytes.length !== descriptor.bytes || digest(bytes) !== descriptor.sha256) throw new Error('Release file integrity mismatch')
  return gunzipSync(bytes, { maxOutputLength: 128 * 1024 ** 2 })
}
const index = JSON.parse(await readVerified(manifest.index))
const csv = (await readVerified(manifest.files.find(f => f.path === 'airports.csv.gz'))).toString()
const [header, ...lines] = csv.trim().split(/\r?\n/), keys = parseCsvLine(header)
const airports = new Map(lines.map(line => {
  const airport = Object.fromEntries(parseCsvLine(line).map((value, i) => [keys[i], value]))
  return [airport.ident, airport]
}))
const [west, south, east, north] = manifest.bounds
const report = {
  date: manifest.date, manifestSha256: digest(manifestBytes), airportReferenceSha256: digest(Buffer.from(csv)),
  population: 'Deduplicated observed endpoint associations at OurAirports EU airports within the LUFT viewing rectangle; not a census of flights.',
  continentSource: 'Pinned OurAirports continent field; geographical border cases require editorial review before adopting visual categories.',
  directions: { inbound: {}, outbound: {} }, bins: { inbound: {}, outbound: {} },
  knownExternalAirports: {}, bothEndpoints: index.aircraft.filter(t => t.origin && t.destination).length,
  trackSegments: index.aircraft.length, binSeconds: 1800, timezone: 'UTC',
  limits: 'Unknown counterparts are retained. These counts cannot establish intercontinental flight totals or absence of service. Opposite endpoints may be lost at same-date limits, callsign/continuity barriers or incomplete reception.',
}
const seen = new Set()
for (const track of index.aircraft) {
  for (const [direction, endpoint, other] of [['inbound', track.destination, track.origin], ['outbound', track.origin, track.destination]]) {
    if (!endpoint) continue
    const airport = airports.get(endpoint.icao)
    if (!airport || airport.continent !== 'EU' || Number(airport.longitude_deg) < west || Number(airport.longitude_deg) > east || Number(airport.latitude_deg) < south || Number(airport.latitude_deg) > north) continue
    if (!Number.isFinite(endpoint.time) || endpoint.time < 0 || endpoint.time >= 86400) throw new Error('Endpoint outside UTC day')
    const key = `${track.icaoAddress}:${endpoint.icao}:${direction}:${endpoint.time}`
    if (seen.has(key)) continue
    seen.add(key)
    const otherAirport = airports.get(other?.icao), continent = otherAirport?.continent || 'unknown'
    report.directions[direction][continent] = (report.directions[direction][continent] ?? 0) + 1
    report.bins[direction][continent] ??= Array(48).fill(0)
    report.bins[direction][continent][Math.floor(endpoint.time / 1800)]++
    if (continent !== 'EU' && continent !== 'unknown') {
      const external = report.knownExternalAirports[other.icao] ??= { iata: other.iata, city: other.city, continent, country: otherAirport.iso_country, inbound: 0, outbound: 0 }
      external[direction]++
    }
  }
}
await writeFile(resolve(outputPath), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ date: report.date, directions: report.directions, bothEndpoints: report.bothEndpoints, trackSegments: report.trackSegments }, null, 2))
