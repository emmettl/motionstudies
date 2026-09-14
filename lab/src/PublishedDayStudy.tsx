import { useEffect, useMemo, useRef, useState } from 'react'
import { cellKey, cellOf, fetchTransport, journeyAt, openPublishedDay, positionAt, sliceStart, type MembersFile, type PublishedDay, type SliceCell, type SliceFile, type VehicleDay } from '@motionstudies/core/domain/published-day'

/** Opens a published day of the national layer and descends it: slices of cells (the sea), a cell's members (the
 * shoal), one vehicle's pack (the fish). The fixture is three slices and two small operators trimmed from the day
 * compiled from the recorded national hour; every number shown is read from the files, none is invented. */
const base = './data/published-day/2026-09-14'
interface Picked { readonly key: string; readonly cell: SliceCell | null; readonly members: readonly (readonly [string, string])[] }

export function PublishedDayStudy() {
  const [day, setDay] = useState<PublishedDay>()
  const [error, setError] = useState<string>()
  const [sliceIndex, setSliceIndex] = useState(0)
  const [slice, setSlice] = useState<SliceFile>()
  const [members, setMembers] = useState<MembersFile>()
  const [picked, setPicked] = useState<Picked>()
  const [vehicle, setVehicle] = useState<{ operator: string; ref: string; day: VehicleDay }>()
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => { openPublishedDay(fetchTransport(base)).then(setDay, (e: Error) => setError(e.message)) }, [])
  const name = day?.sliceNames[sliceIndex]
  useEffect(() => { if (!day || !name) return; let live = true; Promise.all([day.slice(name), day.members(name)]).then(([s, m]) => { if (live) { setSlice(s); setMembers(m) } }, (e: Error) => setError(e.message)); return () => { live = false } }, [day, name])
  const bounds = useMemo(() => {
    if (!slice) return null
    let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity
    for (const [lon, lat] of slice.cells) { west = Math.min(west, lon); east = Math.max(east, lon + 0.1); south = Math.min(south, lat); north = Math.max(north, lat + 0.1) }
    return { west: west - 0.1, east: east + 0.1, south: south - 0.1, north: north + 0.1 }
  }, [slice])
  const at = useMemo(() => (day && name ? Date.parse(sliceStart(day.manifest.date, name)) / 1000 : 0), [day, name])
  useEffect(() => {
    const el = canvas.current; if (!el || !slice || !bounds) return
    const width = el.clientWidth || 640, height = Math.round(width * (bounds.north - bounds.south) / (bounds.east - bounds.west) * 1.6)
    el.width = width; el.height = height
    const ctx = el.getContext('2d')!; ctx.fillStyle = '#0c1018'; ctx.fillRect(0, 0, width, height)
    const x = (lon: number) => (lon - bounds.west) / (bounds.east - bounds.west) * width, y = (lat: number) => (bounds.north - lat) / (bounds.north - bounds.south) * height
    const most = Math.max(1, ...slice.cells.map(c => c[2]))
    for (const [lon, lat, samples] of slice.cells) { ctx.fillStyle = `rgba(120, 190, 255, ${0.15 + 0.75 * samples / most})`; ctx.fillRect(x(lon) + 1, y(lat + 0.1) + 1, x(lon + 0.1) - x(lon) - 2, y(lat) - y(lat + 0.1) - 2) }
    if (picked?.cell) { const [lon, lat] = picked.cell; ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.strokeRect(x(lon), y(lat + 0.1), x(lon + 0.1) - x(lon), y(lat) - y(lat + 0.1)) }
    if (vehicle) {
      ctx.strokeStyle = '#ff8fa3'; ctx.lineWidth = 1.5; ctx.beginPath()
      vehicle.day.track.forEach(([, lon, lat], i) => (i ? ctx.lineTo(x(lon), y(lat)) : ctx.moveTo(x(lon), y(lat)))); ctx.stroke()
      const p = positionAt(vehicle.day.track, at + 150)
      if (p) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x(p[0]), y(p[1]), 4, 0, Math.PI * 2); ctx.fill() }
    }
  }, [slice, bounds, picked, vehicle, at])
  const pickCell = (cellLon: number, cellLat: number) => {
    if (!slice || !members || !day) return
    const key = cellKey(cellLon, cellLat), cell = slice.cells.find(c => cellKey(c[0], c[1]) === key) ?? null
    setPicked({ key, cell, members: (members.cells[key] ?? []).map(([i, ref]) => [day.index.operators[i].ref, ref] as const) }); setVehicle(undefined)
  }
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const el = canvas.current; if (!el || !bounds) return
    const r = el.getBoundingClientRect(), lon = bounds.west + (e.clientX - r.left) / r.width * (bounds.east - bounds.west), lat = bounds.north - (e.clientY - r.top) / r.height * (bounds.north - bounds.south)
    const [cellLon, cellLat] = cellOf(lon, lat); pickCell(cellLon, cellLat)
  }
  const pickBusiest = () => { if (!slice) return; const c = slice.cells.reduce((a, b) => (b[2] > a[2] ? b : a)); pickCell(c[0], c[1]) }
  const open = (operator: string, ref: string) => { day?.vehicle(operator, ref).then(v => { if (v) setVehicle({ operator, ref, day: v }) }, (e: Error) => setError(e.message)) }
  const run = vehicle ? journeyAt(vehicle.day.journeys, at + 150) : null, position = vehicle ? positionAt(vehicle.day.track, at + 150) : null
  return <section className="published-day-study">
    <p className="note" data-testid="published-day-status">{error ? `Could not open the day: ${error}` : day ? `Published day ${day.manifest.date}: ${day.manifest.stats.samples.toLocaleString('en-GB')} samples, ${day.manifest.stats.vehicles.toLocaleString('en-GB')} vehicles, ${day.manifest.stats.operators} operators; this fixture carries ${day.sliceNames.length} slices and ${day.index.operators.length} operators.` : 'Opening the published day…'}</p>
    <div className="controls">
      <label>Slice <input aria-label="Slice time" type="range" min="0" max={Math.max(0, (day?.sliceNames.length ?? 1) - 1)} step="1" value={sliceIndex} onChange={e => { setSliceIndex(Number(e.target.value)) }} /></label><output data-testid="published-day-slice">{name ? `${name.replace('-', ':')} UTC` : '—'}</output>
      <button type="button" onClick={pickBusiest}>Pick busiest cell</button>
    </div>
    <div className="field-specimen"><canvas ref={canvas} aria-label="Published day slice" data-testid="published-day-canvas" onClick={onClick} /></div>
    <div className="readout" role="status" data-testid="published-day-readout">
      {!picked ? <span>Click a cell to see who is in it</span> : <span>Cell {picked.key}: {picked.cell ? `${picked.cell[2]} samples from ${picked.cell[3]} vehicles` : 'no samples in this slice'}</span>}
      {picked && picked.members.length > 0 && <ul data-testid="published-day-members">{picked.members.map(([operator, ref]) => <li key={`${operator}/${ref}`}><button type="button" onClick={() => open(operator, ref)}>{operator} {ref}</button></li>)}</ul>}
      {vehicle && <p data-testid="published-day-vehicle">{vehicle.operator} {vehicle.ref}: {vehicle.day.track.length} samples over the day, {vehicle.day.journeys.length} journey runs; at {name?.replace('-', ':')}+2:30 {position ? `at ${position[1].toFixed(4)}, ${position[0].toFixed(4)}` : 'not reporting'}{run ? ` on line ${run[1] ?? '?'} journey ${run[2] ?? '?'}` : ''}</p>}
    </div>
  </section>
}
