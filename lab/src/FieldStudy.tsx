import { useEffect, useMemo, useRef, useState } from 'react'
import { createFieldGrid, sampleFieldGrid, sampleFieldGridAt, type FieldSample, type FieldStation, type FieldSupportOptions } from '@motionstudies/core/domain/supported-field'
import { advanceFieldPath, mixFieldMovement, visibleTrailSegments, type FieldMovement, type FieldPoint, type FieldTrack } from '@motionstudies/core/domain/field-paths'
import { sampleGriddedSeries, type GriddedSeries } from '@motionstudies/core/domain/gridded-series'
import { daylightAt } from '@motionstudies/core/domain/daylight'

/** A synthetic archipelago of instruments on a 0.1° grid. Values, vectors, gaps and the cover series are invented. */
const bounds = { west: 0, east: 6, south: 50, north: 54, step: 0.1 }
const stations: FieldStation[] = [[50.6, 0.7], [51.4, 2.2], [52.9, 1.1], [52.2, 3.6], [53.5, 3.0], [51.0, 4.9], [53.2, 5.4]].map(([latitude, longitude]) => ({ latitude, longitude }))
const frameCount = 25, minutesPerFrame = 5, studyDate = Date.parse('2026-03-20T05:00:00Z'), latitudeRow = 52
const gapStation = 3, vectorlessStation = 5
function stationFrame(index: number, frame: number): FieldSample {
  if (index === gapStation && frame >= 8 && frame <= 14) return { value: null }
  const value = Math.max(0, 40 + 30 * Math.sin(frame / 6 + index * 1.3))
  const angle = index * 0.9 + frame / 10
  return { value, vector: index === vectorlessStation ? null : [8 * Math.cos(angle), 8 * Math.sin(angle)] }
}
/** Linear interpolation between adjacent frames per station; a gap on either side stays a gap. */
function stationAt(index: number, time: number): FieldSample {
  const a = Math.floor(time), b = Math.min(frameCount - 1, a + 1), f = time - a, x = stationFrame(index, a), y = stationFrame(index, b)
  if (x.value === null || y.value === null) return { value: null }
  const vector = x.vector && y.vector ? [x.vector[0] * (1 - f) + y.vector[0] * f, x.vector[1] * (1 - f) + y.vector[1] * f] as const : null
  return { value: x.value * (1 - f) + y.value * f, vector }
}
const cover: GriddedSeries<'cover'> = {
  times: ['2026-03-20T05:00:00Z', '2026-03-20T07:00:00Z'], grid: { west: 0, south: 50, step: 1, width: 7, height: 5 },
  frames: [{ cover: Array.from({ length: 35 }, (_, i) => (i % 7) * 12) }, { cover: Array.from({ length: 35 }, (_, i) => 90 - Math.floor(i / 7) * 20) }],
}
const clockAt = (time: number) => studyDate + time * minutesPerFrame * 60_000
const supportFor = (scaleKm: number): FieldSupportOptions => ({ scaleKm, reachStartKm: scaleKm * 2, reachKm: scaleKm * 8 / 3, supportNearKm: scaleKm * 4 / 3, supportFarKm: scaleKm * 8 / 3 })

export function FieldStudy() {
  const [time, setTime] = useState(4)
  const [scaleKm, setScaleKm] = useState(45)
  const [movement, setMovement] = useState(false)
  const [trails, setTrails] = useState(true)
  const [haze, setHaze] = useState(true)
  const [picked, setPicked] = useState<FieldPoint>()
  const canvas = useRef<HTMLCanvasElement>(null)
  const options = useMemo(() => supportFor(scaleKm), [scaleKm])
  const grid = useMemo(() => createFieldGrid(stations, bounds, options), [options])
  const frames = useMemo(() => Array.from({ length: frameCount }, (_, frame) => sampleFieldGrid(grid, (index) => stationFrame(index, frame), 1, options, true)), [grid, options])
  const field = useMemo(() => sampleFieldGrid(grid, (index) => stationAt(index, time), 1, options, movement), [grid, options, time, movement])
  const tracks = useMemo(() => {
    const sample = (point: FieldPoint, at: number): FieldMovement | null => {
      const a = Math.floor(at), b = Math.min(frameCount - 1, a + 1), read = (frame: number) => {
        const value = sampleFieldGridAt(frames[frame], grid, point.latitude, point.longitude, 0)
        return value?.vector ? { value: value.value, vector: value.vector, support: value.support } : null
      }
      return mixFieldMovement(read(a), read(b), at - a)
    }
    return Array.from({ length: 14 }, (_, seed): FieldTrack => {
      let point: FieldPoint = { latitude: 50.4 + (seed % 7) * 0.55, longitude: 0.5 + Math.floor(seed / 7) * 3.2 + (seed % 3) * 0.6 }
      const points: number[][] = [[point.latitude, point.longitude]]
      for (let step = 0; step < frameCount - 1; step++) {
        const next = advanceFieldPath(point, step, 1, sample, 3600)
        if (!next) break
        point = next; points.push([next.latitude, next.longitude])
      }
      return { start: 0, level: 0, points }
    })
  }, [frames, grid])
  const reading = useMemo(() => {
    if (!picked) return null
    const value = sampleFieldGridAt(field, grid, picked.latitude, picked.longitude, 0)
    const sun = daylightAt(clockAt(time), picked.latitude, picked.longitude)
    return { value, cover: sampleGriddedSeries(cover, 'cover', picked.latitude, picked.longitude, clockAt(time)), altitude: sun?.altitude ?? null }
  }, [picked, field, grid, time])

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const cell = 10, width = grid.width * cell, height = grid.height * cell
    element.width = width; element.height = height
    context.fillStyle = '#05070c'; context.fillRect(0, 0, width, height)
    const column = (x: number) => daylightAt(clockAt(time), latitudeRow, bounds.west + x * bounds.step)
    for (let x = 0; x < grid.width; x++) {
      const light = 0.3 + 0.7 * (column(x)?.daylight ?? 0)
      for (let y = 0; y < grid.height; y++) {
        const o = (y * grid.width + x) * 4, value = field[o], support = field[o + 3]
        if (!Number.isFinite(value) || !Number.isFinite(support)) continue
        const bright = Math.min(1, value / 70)
        context.fillStyle = `rgba(${Math.round(120 + 135 * bright)},${Math.round(170 + 85 * bright)},255,${(0.15 + 0.85 * bright) * support * light})`
        context.fillRect(x * cell, height - (y + 1) * cell, cell, cell)
      }
    }
    if (haze) for (let x = 0; x < width; x += cell) for (let y = 0; y < height; y += cell) {
      const amount = sampleGriddedSeries(cover, 'cover', bounds.south + (grid.height - 1 - y / cell) * bounds.step, bounds.west + (x / cell) * bounds.step, clockAt(time))
      if (amount === null) continue
      context.fillStyle = `rgba(255,255,255,${amount / 100 * 0.35})`; context.fillRect(x, y, cell, cell)
    }
    const px = (latitude: number, longitude: number) => [((longitude - bounds.west) / bounds.step + 0.5) * cell, height - ((latitude - bounds.south) / bounds.step + 0.5) * cell] as const
    if (trails) for (const track of tracks) for (const segment of visibleTrailSegments(track, time, 6)) {
      const [ax, ay] = px(segment.a[0], segment.a[1]), [bx, by] = px(segment.b[0], segment.b[1])
      context.strokeStyle = `rgba(255,230,160,${segment.tail * segment.fade})`; context.lineWidth = 2
      context.beginPath(); context.moveTo(ax, ay); context.lineTo(bx, by); context.stroke()
    }
    stations.forEach((station, index) => {
      const [x, y] = px(station.latitude, station.longitude), sample = stationAt(index, time)
      context.beginPath(); context.arc(x, y, 4, 0, Math.PI * 2)
      context.fillStyle = sample.value === null ? '#ff5a5a' : '#ffffff'; context.fill()
    })
    if (picked) {
      const [x, y] = px(picked.latitude, picked.longitude)
      context.strokeStyle = '#ffd166'; context.lineWidth = 1.5; context.beginPath(); context.arc(x, y, 7, 0, Math.PI * 2); context.stroke()
    }
  }, [field, grid, tracks, time, trails, haze, picked])

  const pick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect(), fx = (event.clientX - box.left) / box.width, fy = (event.clientY - box.top) / box.height
    setPicked({ latitude: bounds.north - fy * (bounds.north - bounds.south), longitude: bounds.west + fx * (bounds.east - bounds.west) })
  }
  const clock = new Date(clockAt(time)).toISOString().slice(11, 16)
  const missing = stations.filter((_, index) => stationAt(index, time).value === null).length
  return <>
    <div className="toolbar">
      <label>Kernel scale <input aria-label="Kernel scale" type="range" min="30" max="200" step="10" value={scaleKm} onChange={(e) => setScaleKm(Number(e.target.value))} /></label><output>{scaleKm} km</output>
      <label><input type="checkbox" checked={movement} onChange={(e) => setMovement(e.target.checked)} /> Movement only</label>
      <label><input type="checkbox" checked={trails} onChange={(e) => setTrails(e.target.checked)} /> Trails</label>
      <label><input type="checkbox" checked={haze} onChange={(e) => setHaze(e.target.checked)} /> Cover haze</label>
    </div>
    <div className="field-specimen"><canvas ref={canvas} aria-label="Supported field specimen" data-testid="field-canvas" onClick={pick} /></div>
    <div className="timeline"><label>Study time <input aria-label="Field time" type="range" min="0" max={frameCount - 1} step="0.25" value={time} onChange={(e) => setTime(Number(e.target.value))} /></label><output data-testid="field-clock">{clock} UTC</output></div>
    <p className="note" data-testid="field-coverage">{missing} of {stations.length} instruments missing at this instant; a red dot marks a silent instrument.</p>
    <div className="readout" role="status" data-testid="field-readout"><span>{!picked ? 'Click the field to read it' : !reading?.value ? 'Unsupported: no evidence within reach' : `Estimate · support ${reading.value.support.toFixed(2)}`}</span>
      <pre>{JSON.stringify(picked && reading ? { latitude: +picked.latitude.toFixed(2), longitude: +picked.longitude.toFixed(2), value: reading.value ? +reading.value.value.toFixed(1) : null,
        vector: reading.value?.vector ? reading.value.vector.map((v) => +v.toFixed(1)) : null, support: reading.value ? +reading.value.support.toFixed(2) : 0,
        cover: reading.cover === null ? null : +reading.cover.toFixed(0), sunAltitude: reading.altitude === null ? null : +reading.altitude.toFixed(1) } : {}, null, 2)}</pre></div>
    <p className="note">Invented instruments, values and cover. Brightness is the estimated value, opacity is support, and the terminator crosses from the east as the clock advances. One instrument stops reporting mid-study and one never reports a vector; trails end where support ends.</p>
  </>
}
