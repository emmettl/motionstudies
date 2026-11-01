import { useMemo, useState } from 'react'
import { fuelMixAt, readPowerDay, sumPower, unitPower, type PowerDay } from '@motionstudies/core/domain/power-day'

function fixture(kind: string): PowerDay {
  const [date, startUtc, endUtc] = kind === 'short' ? ['2026-03-29', '2026-03-29T00:00:00Z', '2026-03-29T23:00:00Z'] : kind === 'long' ? ['2026-10-25', '2026-10-24T23:00:00Z', '2026-10-26T00:00:00Z'] : ['2026-09-05', '2026-09-04T23:00:00Z', '2026-09-05T23:00:00Z']
  const count = (Date.parse(endUtc) - Date.parse(startUtc)) / 1800000, hash = 'a'.repeat(64)
  return readPowerDay({ kind: 'power-day', schemaVersion: 1, date, timezone: 'Europe/London', startUtc, endUtc, periodSeconds: 1800,
    quantityUnit: 'MWh', powerUnit: 'MW', scope: 'Lab', population: 'Two invented units',
    sources: [{ sha256: hash, url: 'https://example.test/synthetic', retrievedAt: '2026-11-01T00:00:00Z', publisher: 'Synthetic fixture' }],
    attribution: [{ statement: 'Invented evidence', licence: 'https://example.test/synthetic' }], settlementSources: Array(count).fill(hash), planSources: Array(count).fill(hash), demandMw: Array(count).fill(null),
    fuelMix: [{ time: 0, byFuel: { WIND: 0, GAS: null } }, { time: 600, byFuel: { WIND: 20, GAS: 10 } }],
    units: ['Wind', 'Storage'].map((name, j) => {
      const settledMwh = Array.from({ length: count }, (_, i) => i === 2 || (j === 1 && i === 3) ? null : i === 0 ? (j ? -2 : 4) : i === 1 ? 0 : Math.round(5 + 4 * Math.sin(i / 4 + j)))
      return { id: name, name, fuelType: j ? 'STORAGE' : 'WIND', capacityMw: 20, settledMwh, runs: settledMwh.map(v => v === null ? null : 'II'), plan: [[0, 3600, 0, 12], [5400, count * 1800, 8, 8]] }
    }) })
}
const value = (n: number | null, unit: string) => n === null ? 'Missing' : `${+n.toFixed(2)} ${unit}`
export function PowerDayStudy() {
  const [kind, setKind] = useState('normal'), [time, setTime] = useState(0), [storage, setStorage] = useState(true)
  const day = useMemo(() => fixture(kind), [kind]), duration = day.demandMw.length * 1800
  const members = storage ? day.units : day.units.slice(0, 1), total = sumPower(day, members, time), fuel = fuelMixAt(day, time)
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: day.timezone, hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(Date.parse(day.startUtc) + time * 1000)
  return <>
    <div className="toolbar"><label>Civil day <select aria-label="Power civil day" value={kind} onChange={e => { setKind(e.target.value); setTime(0) }}><option value="normal">24 hours</option><option value="short">Spring · 23 hours</option><option value="long">Autumn · 25 hours</option></select></label>
      <label><input type="checkbox" checked={storage} onChange={e => setStorage(e.target.checked)} /> Include storage in aggregate</label>
    </div>
    <p data-testid="power-day-length">{day.date} · {day.demandMw.length} half-hour periods · {day.timezone}</p>
    <div className="timeline"><label>Elapsed seconds <input aria-label="Power time" type="range" min="0" max={duration} step="60" value={time} onChange={e => setTime(+e.target.value)} /></label><output data-testid="power-clock">{clock} · {time} s elapsed</output></div>
    <div className="toolbar">{[0, 300, 600, 1800, 3600, 5400, 7200, duration].map(t => <button key={t} onClick={() => setTime(t)}>{t === duration ? 'Day end' : `${t} s`}</button>)}</div>
    <div className="readout" data-testid="power-readout"><table><thead><tr><th>Unit</th><th>Interval energy</th><th>Average power</th><th>Planned power</th><th>Run</th></tr></thead><tbody>{day.units.map(u => { const p = unitPower(day, u, time); return <tr key={u.id}><th>{u.name}</th><td>{value(p.settledMwh, 'MWh')}</td><td>{value(p.averageMw, 'MW')}</td><td>{value(p.plannedMw, 'MW')}</td><td>{p.run ?? 'Missing'}</td></tr> })}</tbody></table></div>
    <p data-testid="power-total">Aggregate: {value(total.averageMw, 'MW')} · {total.available} available · {total.missing} missing contributors</p>
    <p data-testid="power-fuel">Fuel sample: {fuel ? Object.entries(fuel.byFuel).map(([name, n]) => `${name}: ${value(n, 'MW')}`).join(' · ') : 'Missing / expired'}</p>
    <p className="note">Invented settlement evidence. The first period includes signed storage energy; the next is measured zero. Period 3 is missing for both units, period 4 for storage only. Plans have a gap at 3600–5400 s. Fuel evidence expires after five minutes. Day end is outside the half-open evidence window.</p>
  </>
}
