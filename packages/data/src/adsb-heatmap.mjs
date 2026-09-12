import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { gunzipSync } from 'node:zlib'

const MAGIC = 0x0e7f7c9d
const CALLSIGN_MARKER = 0x40000000
const NON_ICAO_MARKER = 0x01000000

function serviceDayStart(options) {
  const { serviceDate, utcOffsetHours, windowStart, windowEnd } = options
  const midnight = Date.parse(`${serviceDate}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate) || !Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== serviceDate) {
    throw new Error('A valid serviceDate (YYYY-MM-DD) is required')
  }
  if (!Number.isFinite(utcOffsetHours) || Math.abs(utcOffsetHours) > 14) throw new Error('A valid local UTC offset is required')
  if (!Number.isFinite(windowStart) || !Number.isFinite(windowEnd) || windowStart >= windowEnd) throw new Error('A finite, increasing study window is required')
  if (options.bounds) {
    const [west, south, east, north] = options.bounds
    if (options.bounds.length !== 4 || !options.bounds.every(Number.isFinite) || west < -180 || east > 180 || south < -90 || north > 90 || west >= east || south >= north) {
      throw new Error('bounds must be [west, south, east, north] in geographic degrees')
    }
  }
  return midnight - utcOffsetHours * 3600000
}

/** Decode an uncompressed readsb heatmap slice. Times remain service-local seconds, including after midnight. */
export function decodeAdsbHeatmap(bytes, options, onSample) {
  const dayStart = serviceDayStart(options)
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)
  if (buffer.length % 16 !== 0) throw new Error('Truncated heatmap record')
  const [west, south, east, north] = options.bounds ?? [-180, -90, 180, 90]
  const callsigns = new Map()
  let time
  let count = 0
  for (let offset = 0; offset < buffer.length; offset += 16) {
    const address = buffer.readUInt32LE(offset), encodedLatitude = buffer.readInt32LE(offset + 4)
    if (address === MAGIC) {
      const milliseconds = Number((BigInt(encodedLatitude) << 32n) | BigInt(buffer.readUInt32LE(offset + 8)))
      time = Math.round((milliseconds - dayStart) / 1000)
      continue
    }
    const id = address & 0xffffff
    if ((address & NON_ICAO_MARKER) !== 0 || (options.addresses && !options.addresses.has(id))) continue
    // Negative latitude also sets this bit in two's complement; it is still a position.
    if (encodedLatitude >= 0 && (encodedLatitude & CALLSIGN_MARKER) !== 0) {
      callsigns.set(id, buffer.subarray(offset + 8, offset + 16).toString('ascii').replaceAll('\0', '').trim().toUpperCase())
      continue
    }
    if (time === undefined || time < options.windowStart || time > options.windowEnd) continue
    const latitude = encodedLatitude / 1e6, longitude = buffer.readInt32LE(offset + 8) / 1e6
    if (longitude < west || longitude > east || latitude < south || latitude > north) continue
    const altitude = buffer.readInt16LE(offset + 12), speed = buffer.readInt16LE(offset + 14)
    if (altitude < 0 || speed < 0) continue
    onSample(id, [time, longitude, latitude, altitude * 25, speed / 10, callsigns.get(id)])
    count++
  }
  return count
}

function round(value, digits) {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

function transportScaleTrack(record) {
  const samples = [...record.samples]
    .sort((first, second) => first[0] - second[0])
    .filter((sample, index, all) => index === 0 || sample[0] !== all[index - 1][0])
    .map((sample) => sample.slice(0, 5))
  if (samples.length < 4) return undefined
  const maximumSpeed = samples.reduce((maximum, sample) => Math.max(maximum, sample[4]), 0)
  const maximumAltitude = samples.reduce((maximum, sample) => Math.max(maximum, sample[3]), 0)
  const airlineCallsign = /^[A-Z]{2,4}\d[A-Z0-9]*$/.test(record.callsign)
  if (maximumSpeed < 120 || maximumAltitude < 1_500) return undefined
  if (!airlineCallsign && (maximumSpeed < 250 || maximumAltitude < 10_000)) return undefined
  return {
    id: record.id,
    callsign: record.callsign || record.id.toUpperCase(),
    start: samples[0][0],
    end: samples.at(-1)[0],
    samples,
  }
}

function transportScaleTracks(record) {
  const ordered = [...record.samples]
    .sort((first, second) => first[0] - second[0])
    .filter((sample, index, all) => index === 0 || sample[0] !== all[index - 1][0])
  const segments = []
  let current = []
  let currentCallsign = ''

  for (const sample of ordered) {
    const callsign = sample[5]
    const previous = current.at(-1)
    const callsignChanged = callsign && currentCallsign && callsign !== currentCallsign
    const longGap = previous && sample[0] - previous[0] > 30 * 60
    if (current.length && (callsignChanged || longGap)) {
      segments.push({ callsign: currentCallsign, samples: current })
      current = []
      currentCallsign = ''
    }
    if (callsign) currentCallsign = callsign
    current.push(sample)
  }
  if (current.length) segments.push({ callsign: currentCallsign, samples: current })

  return segments
    .map((segment) => {
      const base = transportScaleTrack({
        id: record.id,
        callsign: segment.callsign || record.callsign,
        samples: segment.samples,
      })
      if (!base) return undefined
      return {
        ...base,
        id: `${record.id}-${base.start}`,
        icaoAddress: record.id,
      }
    })
    .filter(Boolean)
}


/** Stable ordering and IDs; split on a known callsign change or an observation gap over 30 minutes. */
export function transportAirTracks(records, { splitTracks = true } = {}) {
  return [...records].flatMap(record => splitTracks
    ? transportScaleTracks(record)
    : [transportScaleTrack(record)].filter(Boolean))
    .sort((first, second) => first.id.localeCompare(second.id))
}

/** Produce playback chunks with the same 180s trail and 45s interpolation overlap used by the editions. */
export function chunkAirSnapshot(snapshot, { chunkSeconds, stem, overlapBefore = 180, overlapAfter = 45 }) {
  if (!Number.isInteger(chunkSeconds) || chunkSeconds <= 0) throw new Error('chunkSeconds must be a positive integer')
  if (![overlapBefore, overlapAfter].every(value => Number.isFinite(value) && value >= 0)) throw new Error('Chunk overlap must be non-negative')
  if (!/^[a-zA-Z0-9_-]+$/.test(stem)) throw new Error('A simple chunk filename stem is required')
  const { windowStart: start, windowEnd: end } = snapshot.metadata
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) throw new Error('A finite, increasing study window is required')
  const chunks = []
  for (let windowStart = start; windowStart < end; windowStart += chunkSeconds) {
    const windowEnd = Math.min(end, windowStart + chunkSeconds)
    const id = String(Math.floor(windowStart / chunkSeconds)).padStart(2, '0')
    const tracks = snapshot.tracks.flatMap(track => {
      const samples = track.samples.filter(sample => sample[0] >= windowStart - overlapBefore && sample[0] <= windowEnd + overlapAfter)
      return samples.length < 2 ? [] : [{ ...track, start: samples[0][0], end: samples.at(-1)[0], samples }]
    })
    const payload = { windowStart, windowEnd, tracks }
    const serialized = `${JSON.stringify(payload)}\n`
    chunks.push({ descriptor: {
      id, windowStart, windowEnd, path: `${stem}-${id}.json`, trackCount: tracks.length,
      sampleCount: tracks.reduce((sum, track) => sum + track.samples.length, 0),
      bytes: Buffer.byteLength(serialized), sha256: createHash('sha256').update(serialized).digest('hex'),
    }, payload })
  }
  const aircraft = snapshot.tracks.map(({ samples: _samples, ...track }) => ({
    ...track, icaoAddress: track.icaoAddress ?? track.id,
    chunkIds: chunks.filter(({ descriptor }) => track.end >= descriptor.windowStart && track.start <= descriptor.windowEnd)
      .map(({ descriptor }) => descriptor.id),
  }))
  return { manifest: {
    metadata: snapshot.metadata, bounds: snapshot.bounds, trackCount: snapshot.tracks.length,
    sampleCount: snapshot.tracks.reduce((sum, track) => sum + track.samples.length, 0),
    aircraft, chunks: chunks.map(chunk => chunk.descriptor),
  }, chunks }
}

function sourceUrl(date) {
  return `https://github.com/adsblol/globe_history_${date.slice(0, 4)}/releases/tag/v${date.replaceAll('-', '.')}-planes-readsb-prod-0`
}

/** Compile cached gzip heatmaps. The caller owns source selection, timezone and output location; no network calls. */
export async function ingestAdsbHeatmaps(options) {
  serviceDayStart(options)
  if (!options.bounds) throw new Error('Study bounds are required')
  if (!options.inputs?.length) throw new Error('At least one cached heatmap input is required')
  if (options.chunkHours !== undefined && (!Number.isInteger(options.chunkHours) || options.chunkHours < 1)) throw new Error('chunkHours must be a positive integer')
  if (!options.output?.endsWith('.json')) throw new Error('An output .json path is required')
  if (options.timezone) new Intl.DateTimeFormat('en', { timeZone: options.timezone })
  const records = new Map(), sourceFiles = []
  // Preserve caller ordering for deterministic first-observation wins when input slices overlap.
  for (const input of options.inputs) {
    const raw = await readFile(input), name = basename(input)
    const date = /^\d{4}-\d{2}-\d{2}/.exec(name)?.[0] ?? options.serviceDate
    sourceFiles.push({ name, sha256: createHash('sha256').update(raw).digest('hex'), sourceUrl: sourceUrl(date) })
    decodeAdsbHeatmap(gunzipSync(raw), options, (address, sample) => {
      const id = address.toString(16).padStart(6, '0')
      const record = records.get(id) ?? { id, callsign: '', samples: [] }
      record.callsign = sample[5] || record.callsign
      record.samples.push([sample[0], round(sample[1], 5), round(sample[2], 5), sample[3], round(sample[4], 1), record.callsign])
      records.set(id, record)
    })
  }
  const tracks = transportAirTracks(records.values(), { splitTracks: options.splitTracks ?? true })
  const [minLongitude, minLatitude, maxLongitude, maxLatitude] = options.bounds
  const snapshot = {
    metadata: {
      publisher: 'ADSB.lol', ...(options.timezone ? { timezone: options.timezone } : {}),
      utcOffsetHours: options.utcOffsetHours, sourceFiles,
      serviceDate: options.serviceDate, windowStart: options.windowStart, windowEnd: options.windowEnd,
      sourceUrl: sourceUrl(options.serviceDate), license: 'ODbL 1.0',
      licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
      model: 'Observed ADS-B / MLAT heatmap positions replayed at 10-second resolution',
      note: 'Ground, non-ICAO, low-speed and low-altitude signals are excluded; altitude is rendered with explicit vertical compression.',
      sampleIntervalSeconds: 10,
    },
    bounds: { minLongitude, minLatitude, maxLongitude, maxLatitude }, tracks,
  }
  if (options.chunkHours !== undefined) {
    const { manifest, chunks } = chunkAirSnapshot(snapshot, {
      chunkSeconds: options.chunkHours * 3600, stem: basename(options.output, '.json').replace(/-manifest$/, ''),
    })
    for (const { descriptor, payload } of chunks) {
      await writeFile(join(dirname(options.output), descriptor.path), `${JSON.stringify(payload)}\n`)
    }
    await writeFile(options.output, `${JSON.stringify(manifest)}\n`)
    return manifest
  }
  await writeFile(options.output, `${JSON.stringify(snapshot)}\n`)
  return snapshot
}
