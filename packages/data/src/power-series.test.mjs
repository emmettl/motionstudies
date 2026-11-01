import { expect, it } from 'vitest'
import { compilePowerSeries } from './power-series.mjs'
const base={startUtc:'2026-09-16T00:00:00Z',endUtc:'2026-09-16T01:00:00Z',scope:'Synthetic',areas:[{id:'a',name:'a',kind:'country',description:'Synthetic'}],sources:[{id:'s',publisher:'Fixture',url:'https://example.org',sha256:'a'.repeat(64),retrievedAt:'2026-11-01T00:00:00Z',license:'Synthetic',attribution:'Invented'}]}
const column={id:'demand',area:'a',measure:'demand',providerCategory:{id:'load',name:'Load'},sourceId:'s',signConvention:'provider-native',evidenceKind:'reported',status:'Synthetic',inputUnit:'GW',intervalSeconds:3600,timestampPosition:'end',rows:[{timestamp:'2026-09-16T03:00:00+02:00',value:-2,sourceRow:3},{timestamp:'2026-09-16T04:00:00+02:00',value:0,sourceRow:4}]}
it('normalizes explicit units and interval endpoints without inventing rows or losing source indices',()=>{
  const d=compilePowerSeries({...base,columns:[column]})
  expect(d.series[0].intervals).toEqual([{startUtc:'2026-09-16T00:00:00.000Z',endUtc:'2026-09-16T01:00:00.000Z',value:-2000,sourceRow:3}])
})
it('rejects inferred intervals, unqualified local time, invalid calendar dates and percentages as power',()=>{
  for(const change of [{timestampPosition:undefined},{inputUnit:'kWh'},{measure:'share'},{rows:[{...column.rows[0],timestamp:'2026-09-16T01:00:00'}]},{rows:[{...column.rows[0],timestamp:'2026-02-30T01:00:00Z'}]}])expect(()=>compilePowerSeries({...base,columns:[{...column,...change}]})).toThrow()
})
