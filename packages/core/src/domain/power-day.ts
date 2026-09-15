/** Dated electricity evidence. All times are elapsed UTC seconds from startUtc.
 * Settlement is interval energy (MWh); plans and national aggregates are power (MW).
 * Geography, population selection and placement policy belong to the consuming work.
 */
export interface PowerSource { sha256: string; url: string; retrievedAt: string; publisher: string }
export interface PowerPlacement {
  method: 'site' | 'connection' | 'curated' | 'aggregate' | 'interconnector' | 'unplaced'
  latitude?: number; longitude?: number; note?: string | null; source?: string | null
  score?: number; matched?: Record<string, unknown>
}
export interface PowerUnit {
  id: string; name: string; fuelType: string | null; capacityMw: number | null
  settledMwh: (number | null)[]; runs: (string | null)[]
  /** [start, end, start MW, end MW]; half-open intervals, no extrapolation. */
  plan: [number, number, number, number][]
  placement?: PowerPlacement
  evidence?: { path: string; sha256: string; bytes: number }
}
export interface PowerDay {
  kind: 'power-day'; schemaVersion: 1; date: string; timezone: string
  startUtc: string; endUtc: string; periodSeconds: 1800
  quantityUnit: 'MWh'; powerUnit: 'MW'; scope: string; population: string
  units: PowerUnit[]; demandMw: (number | null)[]
  fuelMix: { time: number; byFuel: Record<string, number | null> }[]
  settlementSources: string[]; planSources: string[]; sources: PowerSource[]
  attribution: { statement: string; licence: string }[]
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const nullable = (v: unknown) => v === null || finite(v)
const hash = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v)
const nonempty = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const utc = (v: unknown): v is string => typeof v === 'string' && /Z$/.test(v) && Number.isFinite(Date.parse(v))
function requireValue(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`Invalid power day: ${message}`) }
/** Validate untrusted JSON at both publication and browser boundaries. Does not fetch. */
export function readPowerDay(value: unknown): PowerDay {
  requireValue(object(value), 'expected object')
  const d = value
  requireValue(d.kind === 'power-day' && d.schemaVersion === 1, 'schema')
  requireValue(nonempty(d.timezone) && typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date), 'date/timezone')
  requireValue(utc(d.startUtc) && utc(d.endUtc), 'UTC bounds')
  const duration = (Date.parse(d.endUtc) - Date.parse(d.startUtc)) / 1000, periods = duration / 1800
  requireValue([46, 48, 50].includes(periods) && d.periodSeconds === 1800, 'civil-day intervals')
  // A power day is a complete civil day, including both clock-change days.
  const dateAt = (t: number) => new Intl.DateTimeFormat('en-CA', { timeZone: d.timezone as string, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t)
  const midnight = (t: number) => new Intl.DateTimeFormat('en-GB', { timeZone: d.timezone as string, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(t) === '00:00:00'
  requireValue(dateAt(Date.parse(d.startUtc)) === d.date && midnight(Date.parse(d.startUtc)) && midnight(Date.parse(d.endUtc)) && dateAt(Date.parse(d.endUtc) - 1) === d.date, 'civil date')
  requireValue(d.quantityUnit === 'MWh' && d.powerUnit === 'MW', 'explicit units')
  requireValue(nonempty(d.scope) && nonempty(d.population), 'scope/population')
  requireValue(Array.isArray(d.sources) && d.sources.length > 0, 'sources')
  const hashes = new Set<string>()
  for (const s of d.sources) {
    requireValue(object(s) && hash(s.sha256) && nonempty(s.publisher) && utc(s.retrievedAt) && typeof s.url === 'string' && /^https:\/\//.test(s.url), 'source record')
    requireValue(!hashes.has(s.sha256), 'duplicate source'); hashes.add(s.sha256)
  }
  for (const key of ['settlementSources', 'planSources']) requireValue(Array.isArray(d[key]) && d[key].length === periods && d[key].every((h: unknown) => typeof h === 'string' && hashes.has(h)), `${key} linkage`)
  requireValue(Array.isArray(d.attribution) && d.attribution.length > 0 && d.attribution.every(a => object(a) && nonempty(a.statement) && typeof a.licence === 'string' && /^https:\/\//.test(a.licence)), 'attribution')
  requireValue(Array.isArray(d.demandMw) && d.demandMw.length === periods && d.demandMw.every(nullable), 'demand')
  requireValue(Array.isArray(d.fuelMix), 'fuel mix')
  let previous = -Infinity
  for (const f of d.fuelMix) {
    requireValue(object(f) && finite(f.time) && f.time >= 0 && f.time < duration && f.time > previous && object(f.byFuel) && Object.values(f.byFuel).every(nullable), 'fuel mix samples')
    previous = f.time
  }
  requireValue(Array.isArray(d.units), 'units')
  const ids = new Set<string>()
  for (const u of d.units) {
    requireValue(object(u) && nonempty(u.id) && !ids.has(u.id) && nonempty(u.name), 'unit identity'); ids.add(u.id)
    requireValue((u.fuelType === null || nonempty(u.fuelType)) && nullable(u.capacityMw), 'unit register')
    requireValue(Array.isArray(u.settledMwh) && u.settledMwh.length === periods && u.settledMwh.every(nullable), 'settlement values')
    const settledMwh = u.settledMwh
    requireValue(Array.isArray(u.runs) && u.runs.length === periods && u.runs.every((r, i) => settledMwh[i] === null ? r === null : ['II','SF','R1','R2','R3','RF','DF'].includes(r)), 'settlement runs')
    requireValue(Array.isArray(u.plan) && u.plan.every(p => Array.isArray(p) && p.length === 4 && p.every(finite) && p[0] >= 0 && p[1] <= duration && p[1] > p[0]), 'declared segments')
    if (u.placement !== undefined) {
      const p = u.placement
      requireValue(object(p) && ['site','connection','curated','aggregate','interconnector','unplaced'].includes(String(p.method)), 'placement method')
      const located = ['site','connection','curated'].includes(String(p.method))
      requireValue(located ? finite(p.latitude) && Math.abs(p.latitude) <= 90 && finite(p.longitude) && Math.abs(p.longitude) <= 180 : p.latitude === undefined && p.longitude === undefined, 'placement coordinates')
      if (p.method === 'curated') requireValue(nonempty(p.source), 'curated citation')
    }
    if (u.evidence !== undefined) {
      const e = u.evidence
      requireValue(object(e) && typeof e.path === 'string' && /^evidence\/[a-f0-9]{64}\.json$/.test(e.path) && hash(e.sha256) && Number.isSafeInteger(e.bytes) && Number(e.bytes) > 0, 'evidence artifact')
    }
  }
  return value as unknown as PowerDay
}
export function powerPeriod(day: PowerDay, seconds: number): number | null {
  return Number.isFinite(seconds) && seconds >= 0 && seconds < day.demandMw.length * day.periodSeconds ? Math.floor(seconds / day.periodSeconds) : null
}
/** Return null for a gap or ambiguous overlapping declarations, never infer a plan. */
export function plannedPower(unit: PowerUnit, seconds: number): number | null {
  const segments = unit.plan.filter(p => seconds >= p[0] && seconds < p[1])
  if (segments.length !== 1) return null
  const [start, end, a, b] = segments[0]
  return a + (b - a) * (seconds - start) / (end - start)
}
export function unitPower(day: PowerDay, unit: PowerUnit, seconds: number) {
  const period = powerPeriod(day, seconds), mwh = period === null ? null : unit.settledMwh[period]
  return { period, settledMwh: mwh, averageMw: mwh === null ? null : mwh * 3600 / day.periodSeconds, plannedMw: period === null ? null : plannedPower(unit, seconds), run: period === null ? null : unit.runs[period] }
}
/** Membership is supplied by the work; report missing contributors alongside partial sums. */
export function sumPower(day: PowerDay, units: readonly PowerUnit[], seconds: number) {
  let averageMw = 0, available = 0
  for (const unit of units) { const value = unitPower(day, unit, seconds).averageMw; if (value !== null) { averageMw += value; available++ } }
  return { averageMw: available ? averageMw : null, available, missing: units.length - available }
}
/** Last national sample, valid for at most five minutes and never outside this day. */
export function fuelMixAt(day: PowerDay, seconds: number) {
  if (powerPeriod(day, seconds) === null) return null
  let sample: PowerDay['fuelMix'][number] | undefined
  for (let i = day.fuelMix.length - 1; i >= 0; i--) if (day.fuelMix[i].time <= seconds) { sample = day.fuelMix[i]; break }
  return sample && seconds - sample.time < 300 ? sample : null
}
