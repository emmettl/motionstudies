/** Reporting-area power evidence. Native half-open intervals and provider reports stay separate. */
export interface PowerArea { id: string; name: string; kind: 'country' | 'bidding-zone' | 'control-area'; description: string }
export interface PowerSeriesSource {
  id: string; publisher: string; url: string; sha256: string
  /** Unknown original retrieval remains null on an imported historical capture. */
  retrievedAt: string | null; importedAt?: string
  license: string; attribution: string
}
export type PowerMeasure = 'generation' | 'demand' | 'physical-exchange' | 'commercial-exchange' | 'net-exchange' | 'storage-intake' | 'residual-demand' | 'share'
export interface PowerInterval { startUtc: string; endUtc: string; value: number | null; sourceRow: number }
export interface AreaPowerSeries {
  id: string; area: string; measure: PowerMeasure; unit: 'MW' | '%'
  providerCategory: { id: string; name: string }
  /** Positive physical exchange runs from fromArea to toArea. Never a traced station route. */
  fromArea?: string; toArea?: string
  signConvention: string; evidenceKind: 'reported' | 'estimated'; status: string
  sourceId: string; providerGeneratedAt?: string
  timeSupport: 'interval-mean'; intervals: PowerInterval[]
}
export interface PowerSeriesDataset {
  kind: 'power-series'; schemaVersion: 1; startUtc: string; endUtc: string; scope: string
  areas: PowerArea[]; series: AreaPowerSeries[]; sources: PowerSeriesSource[]
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const stamp = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,19) === v.slice(0,19)
function requireValue(ok: unknown, message: string): asserts ok { if (!ok) throw new Error(`Invalid power series: ${message}`) }
const measures: readonly PowerMeasure[] = ['generation','demand','physical-exchange','commercial-exchange','net-exchange','storage-intake','residual-demand','share']
/** Browser-safe validation at the publication/consumption boundary. No source requests or reconciliation. */
export function readPowerSeries(input: unknown): PowerSeriesDataset {
  requireValue(object(input), 'object')
  const d = input as unknown as PowerSeriesDataset
  requireValue(d.kind === 'power-series' && d.schemaVersion === 1, 'schema')
  requireValue(stamp(d.startUtc) && stamp(d.endUtc) && Date.parse(d.endUtc)>Date.parse(d.startUtc) && text(d.scope), 'window/scope')
  requireValue(Array.isArray(d.areas) && d.areas.length>0 && d.areas.length<=1000, 'areas')
  const areas = new Set<string>(), sources = new Set<string>(), ids = new Set<string>()
  for (const a of d.areas) {
    requireValue(object(a) && text(a.id) && !areas.has(a.id) && text(a.name) && ['country','bidding-zone','control-area'].includes(a.kind) && text(a.description), 'area identity/scope')
    areas.add(a.id)
  }
  requireValue(Array.isArray(d.sources) && d.sources.length>0 && d.sources.length<=10000, 'sources')
  for (const s of d.sources) {
    requireValue(object(s) && text(s.id) && !sources.has(s.id) && text(s.publisher) && typeof s.url==='string' && /^https:\/\//.test(s.url) && /^[a-f0-9]{64}$/.test(s.sha256) && text(s.license) && text(s.attribution), 'source provenance')
    requireValue(s.retrievedAt===null ? stamp(s.importedAt) : stamp(s.retrievedAt), 'source retrieval/import time')
    if(s.importedAt!==undefined)requireValue(stamp(s.importedAt), 'source import time')
    sources.add(s.id)
  }
  requireValue(Array.isArray(d.series) && d.series.length>0 && d.series.length<=5000, 'series')
  let count = 0
  for (const s of d.series) {
    requireValue(object(s) && text(s.id) && !ids.has(s.id) && areas.has(s.area) && measures.includes(s.measure), 'series identity/measure')
    ids.add(s.id)
    requireValue(s.unit===(s.measure==='share'?'%':'MW') && s.timeSupport==='interval-mean' && text(s.signConvention) && ['reported','estimated'].includes(s.evidenceKind) && text(s.status), 'units/support/status')
    requireValue(object(s.providerCategory) && text(s.providerCategory.id) && text(s.providerCategory.name) && sources.has(s.sourceId), 'category/source linkage')
    if(s.providerGeneratedAt!==undefined)requireValue(stamp(s.providerGeneratedAt), 'provider generation time')
    const edge = s.fromArea!==undefined || s.toArea!==undefined
    requireValue(edge ? areas.has(s.fromArea!) && areas.has(s.toArea!) && s.fromArea!==s.toArea && (s.area===s.fromArea || s.area===s.toArea) && ['physical-exchange','commercial-exchange'].includes(s.measure) : s.measure!=='physical-exchange', 'edge orientation')
    if(s.measure==='physical-exchange')requireValue(s.signConvention==='positive-from-to', 'physical exchange sign')
    requireValue(Array.isArray(s.intervals) && s.intervals.length>0 && (count+=s.intervals.length)<=1_000_000, 'intervals')
    let previous = -Infinity
    for (const p of s.intervals) {
      requireValue(object(p) && stamp(p.startUtc) && stamp(p.endUtc) && (p.value===null || typeof p.value==='number' && Number.isFinite(p.value)) && Number.isSafeInteger(p.sourceRow) && p.sourceRow>=0, 'interval evidence')
      const start=Date.parse(p.startUtc), end=Date.parse(p.endUtc)
      requireValue(start>=previous && end>start && end>Date.parse(d.startUtc) && start<Date.parse(d.endUtc), 'ordered non-overlapping intersecting intervals')
      previous=end
    }
  }
  return d
}
const epoch = (time: string | number) => typeof time==='number'?time:Date.parse(time)
/** Native interval evidence remains inspectable even when its value is null. */
export function powerIntervalAt(dataset: PowerSeriesDataset, id: string, time: string | number) {
  const now=epoch(time)
  if(!Number.isFinite(now) || now<Date.parse(dataset.startUtc) || now>=Date.parse(dataset.endUtc))return null
  const series=dataset.series.find(s=>s.id===id)
  if(!series)return null
  const interval=series.intervals.find(p=>now>=Date.parse(p.startUtc) && now<Date.parse(p.endUtc))
  return interval ? {...interval,unit:series.unit,sourceId:series.sourceId} : null
}
export function powerSeriesAt(dataset: PowerSeriesDataset, id: string, time: string | number) {
  const interval=powerIntervalAt(dataset,id,time)
  return interval && interval.value!==null ? {...interval,value:interval.value} : null
}
/** Explicit membership only. Reject duplicate identities and non-power quantities. Missing is counted. */
export function sumPowerSeriesAt(dataset: PowerSeriesDataset, ids: readonly string[], time: string | number) {
  if(new Set(ids).size!==ids.length)throw new Error('Duplicate power series membership')
  let value=0, available=0
  for(const id of ids){
    const series=dataset.series.find(s=>s.id===id)
    if(!series || series.unit!=='MW')throw new Error('Expected an identified MW series')
    const reading=powerSeriesAt(dataset,id,time)
    if(reading){value+=reading.value;available++}
  }
  if(!Number.isFinite(value))throw new Error('Power sum overflow')
  return {value:available?value:null,unit:'MW' as const,available,missing:ids.length-available}
}
/** Integrate interval-mean MW over a requested UTC span; gaps/nulls remain missing duration. */
export function integratePowerSeries(dataset: PowerSeriesDataset, id: string, from: string | number = dataset.startUtc, to: string | number = dataset.endUtc) {
  const start=epoch(from),end=epoch(to), series=dataset.series.find(s=>s.id===id)
  if(!series || series.unit!=='MW')throw new Error('Expected an identified MW series')
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||start<Date.parse(dataset.startUtc)||end>Date.parse(dataset.endUtc))throw new Error('Integration span must be inside the power window')
  let energy=0,available=0
  for(const p of series.intervals){
    const duration=Math.max(0,Math.min(end,Date.parse(p.endUtc))-Math.max(start,Date.parse(p.startUtc)))/1000
    if(p.value!==null){energy+=p.value*duration/3600;available+=duration}
  }
  const seconds=(end-start)/1000
  if(!Number.isFinite(energy))throw new Error('Power integration overflow')
  return {energyMwh:available?energy:null,availableSeconds:available,missingSeconds:seconds-available,coverage:available/seconds}
}
