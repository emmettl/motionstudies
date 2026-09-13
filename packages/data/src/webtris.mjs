import { checkedDate } from './uk-service-day.mjs'

const ENDPOINT = 'https://webtris.nationalhighways.co.uk/api/v1.0/reports/daily'
const CLASSES = ['0 - 520 cm', '521 - 660 cm', '661 - 1160 cm', '1160+ cm']
const number = (v, integer = false) => {
  if (!['number', 'string'].includes(typeof v) || String(v).trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && (!integer || Number.isInteger(n)) ? n : null
}
export function reportUrl(siteIds, serviceDate, page, pageSize = 1000) {
  checkedDate(serviceDate)
  if (!siteIds.length || siteIds.length > 10 || siteIds.some(id => !/^\d+$/.test(id)) || new Set(siteIds).size !== siteIds.length) throw new Error('Select 1..10 distinct numeric site IDs')
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 1000) throw new Error('Expected a positive page and page size of 1..1000')
  const date = serviceDate.split('-').reverse().join('')
  return `${ENDPOINT}?${new URLSearchParams({ sites: siteIds.join(','), start_date: date, end_date: date, page: String(page), page_size: String(pageSize) }).toString().replaceAll('%2C', ',')}`
}

export function normalizeReports(rows, sites, serviceDate) {
  checkedDate(serviceDate)
  if (!Array.isArray(rows) || !Array.isArray(sites) || sites.some(s => !s || typeof s.id !== 'string' || typeof s.description !== 'string') || new Set(sites.map(s => s.id)).size !== sites.length) throw new Error('Expected rows and unique named sites')
  const names = new Map(sites.map(site => [site.description, site]))
  if (names.size !== sites.length) throw new Error('Selected site descriptions are ambiguous')
  const grouped = new Map(sites.map(site => [site.id, new Map()]))
  const audit = { inputRows: rows.length, foreignSite: 0, foreignDate: 0, invalidInterval: 0, exactDuplicates: 0, conflictingIntervals: 0 }
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Invalid WebTRIS row')
    const site = names.get(row['Site Name'])
    if (!site) { audit.foreignSite++; continue }
    if (row['Report Date'] !== `${serviceDate}T00:00:00`) { audit.foreignDate++; continue }
    const interval = number(row['Time Interval'], true)
    const ending = row['Time Period Ending']
    // Preserve the source's minute-inclusive ending label (00:14 etc). No invented UTC offset.
    if (interval === null || interval > 99 || !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(ending ?? '')) { audit.invalidInterval++; continue }
    const sample = { interval, periodEnding: ending, totalVolume: number(row['Total Volume'], true), averageSpeedMph: number(row['Avg mph']), lengthClassCounts: CLASSES.map(key => number(row[key], true)) }
    sample.classTotalMatches = sample.totalVolume === null || sample.lengthClassCounts.includes(null) ? null : sample.lengthClassCounts.reduce((a,b) => a+b,0) === sample.totalVolume
    const map = grouped.get(site.id)
    if (map.has(interval)) {
      if (JSON.stringify(map.get(interval)) === JSON.stringify(sample)) audit.exactDuplicates++
      else { if (map.get(interval) !== null) audit.conflictingIntervals++; map.set(interval, null) }
    } else map.set(interval, sample)
  }
  const observations = sites.map(site => {
    const map = grouped.get(site.id)
    const samples = [...map.values()].filter(Boolean).sort((a,b) => a.interval-b.interval)
    return { site, samples, reportIntervals: samples.length, validVolumeIntervals: samples.filter(x => x.totalVolume !== null).length, validSpeedIntervals: samples.filter(x => x.averageSpeedMph !== null).length,
      missingNominalIntervals: Array.from({ length: 96 }, (_,i) => i).filter(i => !map.get(i)),
      conflictingIntervals: [...map].filter(([,v]) => v === null).map(([i])=>i).sort((a,b)=>a-b),
      classTotalMismatches: samples.filter(x => x.classTotalMatches === false).length }
  })
  return { schemaVersion: 1, kind: 'observed-detector-report-audit', serviceDate, clock: { basis: 'Provider report date, interval index and period-ending label', timezone: null, utcMapping: 'Unverified; not placed on the scene clock', nominalIntervals: 96, completeness: '96-slot reference only; DST and source time semantics require verification' }, lengthClasses: CLASSES, audit, observations,
    representation: 'Point detector counts and reported mph; no reconstructed vehicles, light/heavy inference or gap interpolation' }
}


/** Translate source observations without placing their unverified clock onto UTC. */
export function aggregateRoadSeries(observation, serviceDate, dataset, sourceRecordIds) {
  checkedDate(serviceDate)
  if (!dataset || !observation?.site?.id || !Array.isArray(sourceRecordIds) || !sourceRecordIds.length || sourceRecordIds.some(id => typeof id !== 'string' || !id)) throw new Error('Aggregate evidence requires dataset, site and source records')
  return {
    id: JSON.stringify(['webtris', dataset, observation.site.id]), provider: 'webtris', dataset, siteId: observation.site.id,
    samples: observation.samples.map(s => ({
      interval: { kind: 'provider-slot', serviceDate, index: s.interval, endingLabel: s.periodEnding },
      vehicleCount: s.totalVolume, averageSpeed: s.averageSpeedMph === null ? null : { value: s.averageSpeedMph, unit: 'mph' },
      sourceRecordIds: [...sourceRecordIds],
    })),
  }
}
