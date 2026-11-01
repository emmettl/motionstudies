import { readPowerSeries } from '@motionstudies/core/domain/power-series'

function utc(value) {
  if(typeof value!=='string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(`${value.slice(0,10)}T00:00:00Z`).toISOString().slice(0,10)!==value.slice(0,10))throw new Error('Power column requires explicit valid ISO timestamps')
  return Date.parse(value)
}
/** Offline column compilation. Provider adapters supply identities, scope, status and category policy. */
export function compilePowerSeries({ startUtc, endUtc, scope, areas, sources, columns }) {
  const start=utc(startUtc),end=utc(endUtc)
  if(!Array.isArray(columns)||!columns.length)throw new Error('Power columns required')
  const series=columns.map(column=>{
    const { inputUnit, intervalSeconds, timestampPosition, rows, ...metadata }=column
    if(!['MW','GW','%'].includes(inputUnit) || !Number.isFinite(intervalSeconds) || intervalSeconds<=0 || !['start','end'].includes(timestampPosition) || !Array.isArray(rows))throw new Error('Explicit power units and native intervals required')
    if((column.measure==='share')!==(inputUnit==='%'))throw new Error('Power and percentage columns must remain separate')
    const factor=inputUnit==='GW'?1000:1
    const intervals=rows.map(row=>{
      const t=utc(row.timestamp)-(timestampPosition==='end'?intervalSeconds*1000:0)
      if(row.value!==null && (typeof row.value!=='number'||!Number.isFinite(row.value)))throw new Error('Invalid power column value')
      return {startUtc:new Date(t).toISOString(),endUtc:new Date(t+intervalSeconds*1000).toISOString(),value:row.value===null?null:row.value*factor,sourceRow:row.sourceRow}
    }).filter(p=>Date.parse(p.startUtc)<end&&Date.parse(p.endUtc)>start)
    return {...metadata,unit:inputUnit==='%'?'%':'MW',timeSupport:'interval-mean',intervals}
  })
  return readPowerSeries({kind:'power-series',schemaVersion:1,startUtc:new Date(start).toISOString(),endUtc:new Date(end).toISOString(),scope,areas,sources,series})
}
