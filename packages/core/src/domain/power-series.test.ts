import { describe, expect, it } from 'vitest'
import { integratePowerSeries, powerIntervalAt, powerSeriesAt, readPowerSeries, sumPowerSeriesAt, type PowerSeriesDataset } from './power-series'
function fixture():PowerSeriesDataset {
  return {kind:'power-series',schemaVersion:1,startUtc:'2026-09-16T00:00:00Z',endUtc:'2026-09-16T02:00:00Z',scope:'Synthetic reporting areas',
    areas:['a','b'].map(id=>({id,name:id,kind:'control-area',description:'Synthetic control area'})),
    sources:[{id:'source',publisher:'Synthetic',url:'https://example.org/source',sha256:'a'.repeat(64),retrievedAt:null,importedAt:'2026-11-01T00:00:00Z',license:'Synthetic',attribution:'Invented fixture'}],
    series:[{id:'a-b',area:'b',measure:'physical-exchange',fromArea:'a',toArea:'b',providerCategory:{id:'a',name:'a'},unit:'MW',signConvention:'positive-from-to',evidenceKind:'reported',status:'Synthetic',sourceId:'source',timeSupport:'interval-mean',intervals:[
      {startUtc:'2026-09-16T00:00:00Z',endUtc:'2026-09-16T00:15:00Z',value:-4,sourceRow:7},
      {startUtc:'2026-09-16T00:15:00Z',endUtc:'2026-09-16T00:30:00Z',value:0,sourceRow:8},
      {startUtc:'2026-09-16T00:30:00Z',endUtc:'2026-09-16T00:45:00Z',value:null,sourceRow:9},
      {startUtc:'2026-09-16T01:00:00Z',endUtc:'2026-09-16T02:00:00Z',value:2,sourceRow:10},
    ]}]}
}
describe('reporting-area power series',()=>{
  it('holds native intervals, preserves negative/zero/null, and never extrapolates or fills gaps',()=>{
    const d=readPowerSeries(fixture())
    expect(powerSeriesAt(d,'a-b','2026-09-16T00:14:59Z')).toMatchObject({value:-4,sourceRow:7})
    expect(powerSeriesAt(d,'a-b','2026-09-16T00:15:00Z')?.value).toBe(0)
    for(const time of ['2026-09-16T00:30:00Z','2026-09-16T00:50:00Z',d.endUtc,'bad'])expect(powerSeriesAt(d,'a-b',time)).toBeNull()
    expect(sumPowerSeriesAt(d,['a-b'],'2026-09-16T00:30:00Z')).toEqual({value:null,unit:'MW',available:0,missing:1})
    expect(powerIntervalAt(d,'a-b','2026-09-16T00:30:00Z')).toMatchObject({value:null,sourceRow:9})
  })
  it('integrates clipped native support and reports unavailable duration rather than scaling partial totals',()=>{
    const d=readPowerSeries(fixture())
    expect(integratePowerSeries(d,'a-b')).toEqual({energyMwh:1,availableSeconds:5400,missingSeconds:1800,coverage:.75})
    expect(integratePowerSeries(d,'a-b','2026-09-16T00:05:00Z','2026-09-16T00:10:00Z').energyMwh).toBeCloseTo(-1/3)
    expect(integratePowerSeries(d,'a-b','2026-09-16T00:30:00Z','2026-09-16T01:00:00Z').energyMwh).toBeNull()
    expect(()=>integratePowerSeries(d,'a-b',d.startUtc,'2026-09-17T00:00:00Z')).toThrow('inside')
  })
  it('rejects overlaps, broken provenance, invalid dates and ambiguous identities',()=>{
    const mutations:((d:PowerSeriesDataset)=>void)[]=[d=>{d.series.push(d.series[0])},d=>{d.series[0].intervals[1].startUtc=d.startUtc},d=>{d.sources[0].importedAt=undefined},d=>{d.series[0].sourceId='missing'},d=>{d.series[0].toArea='absent'},d=>{d.series[0].intervals[0].sourceRow=-1},d=>{d.series[0].intervals[0].value=Infinity},d=>{d.startUtc='2026-02-30T00:00:00Z'}]
    for(const mutate of mutations){const d=fixture();mutate(d);expect(()=>readPowerSeries(d)).toThrow()}
  })
  it('separates reporting identities and percentage series, and rejects accidental duplicate sums',()=>{
    const d=fixture(),share={...d.series[0],id:'share',measure:'share' as const,unit:'%' as const,fromArea:undefined,toArea:undefined}
    d.series.push(share);readPowerSeries(d)
    expect(()=>integratePowerSeries(d,'share')).toThrow('MW')
    expect(()=>sumPowerSeriesAt(d,['a-b','a-b'],d.startUtc)).toThrow('Duplicate')
    expect(()=>sumPowerSeriesAt(d,['share'],d.startUtc)).toThrow('MW')
  })
  it('does not deduplicate reports from opposite sides or merge provider disagreements',()=>{
    const d=fixture();d.series.push({...d.series[0],id:'b-a',area:'a',fromArea:'b',toArea:'a',intervals:d.series[0].intervals.map(p=>({...p,value:p.value===null?null:-p.value}))})
    expect(readPowerSeries(d).series).toHaveLength(2)
    expect(powerSeriesAt(d,'b-a',d.startUtc)?.value).toBe(4)
  })
  it('refuses arithmetic overflow even when individual source values are finite',()=>{
    const d=fixture();d.series[0].intervals[0].value=Number.MAX_VALUE;d.series[0].intervals[3].value=Number.MAX_VALUE
    d.series.push({...d.series[0],id:'second'})
    expect(()=>sumPowerSeriesAt(d,['a-b','second'],d.startUtc)).toThrow('overflow')
    expect(()=>integratePowerSeries(d,'a-b')).toThrow('overflow')
  })
})
