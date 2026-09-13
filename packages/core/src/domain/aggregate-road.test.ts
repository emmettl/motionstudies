import {it,expect} from 'vitest'
import {aggregateRoadValue,indexAggregateRoadSlots,type AggregateRoadSample,type AggregateRoadSeries} from './aggregate-road.ts'
const sample=(index:number,count:number|null):AggregateRoadSample=>({interval:{kind:'provider-slot',serviceDate:'2025-09-05',index,endingLabel:'00:14:00'},vehicleCount:count,averageSpeed:null,sourceRecordIds:['source-record']})
const series=(samples:AggregateRoadSample[]):AggregateRoadSeries=>({id:'series',provider:'test',dataset:'release',siteId:'counter',samples})
it('retains measured zero separately from missing or invalid values',()=>{
 expect(aggregateRoadValue(sample(0,0),'vehicleCount')).toBe(0)
 expect(aggregateRoadValue(sample(0,null),'vehicleCount')).toBeNull()
 expect(aggregateRoadValue(sample(0,1.5),'vehicleCount')).toBeNull()
 expect(aggregateRoadValue(sample(0,4),'averageSpeed')).toBeNull()
})
it('separates clocks and dates and never fills gaps or ambiguous slots',()=>{
 const a=sample(0,10),b=sample(1,20),foreign={...sample(3,7),interval:{kind:'provider-slot' as const,serviceDate:'2025-09-06',index:3,endingLabel:'00:59:00'}}
 const utc={...sample(4,2),interval:{kind:'utc' as const,from:'2025-09-05T00:00:00Z',to:'2025-09-05T00:15:00Z'}}
 const slots=indexAggregateRoadSlots(series([a,b,{...b,vehicleCount:30},b,foreign,utc,sample(99,1)]),'2025-09-05')
 expect([...slots.keys()]).toEqual([0,99]);expect(slots.get(2)).toBeUndefined()
})
