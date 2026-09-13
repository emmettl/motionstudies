import {it,expect} from 'vitest'
import {normalizeReports,reportUrl,aggregateRoadSeries} from './webtris.mjs'
const site={id:'243',description:'M32/5069B'}
const row={'Site Name':site.description,'Report Date':'2025-09-05T00:00:00','Time Interval':'0','Time Period Ending':'00:14:00','Total Volume':'0','Avg mph':'','0 - 520 cm':'0','521 - 660 cm':'0','661 - 1160 cm':'0','1160+ cm':'0'}
it('preserves zero, blank speeds, class mismatches and original interval labels',()=>{
 const r=normalizeReports([row,{...row,'Time Interval':1,'Total Volume':10},{...row,'Time Interval':2,'Total Volume':''}],[site],'2025-09-05')
 expect(r.observations[0].samples.map(s=>s.totalVolume)).toEqual([0,10,null])
 expect(r.observations[0].samples[0].averageSpeedMph).toBeNull()
 expect(r.observations[0].classTotalMismatches).toBe(1)
 expect(r.clock.timezone).toBeNull()
 const series=aggregateRoadSeries(r.observations[0],r.serviceDate,'release-one',['sha256:fixture'])
 expect(series.samples[0]).toEqual({interval:{kind:'provider-slot',serviceDate:'2025-09-05',index:0,endingLabel:'00:14:00'},vehicleCount:0,averageSpeed:null,sourceRecordIds:['sha256:fixture']})
 expect(aggregateRoadSeries(r.observations[0],r.serviceDate,'release-two',['sha256:fixture']).id).not.toBe(series.id)
})
it('conflicts cannot be restored by a later duplicate; foreign dates/sites stay excluded',()=>{
 const r=normalizeReports([row,row,{...row,'Total Volume':1},row,{...row,'Site Name':'unknown'},{...row,'Report Date':'2025-09-06T00:00:00'}],[site],'2025-09-05')
 expect(r.observations[0].samples).toEqual([])
 expect(r.audit).toMatchObject({exactDuplicates:1,conflictingIntervals:1,foreignSite:1,foreignDate:1})
})
it('rejects identity ambiguity and invalid pagination; booleans are not measured zeros',()=>{
 expect(()=>normalizeReports([],[site,site],'2025-09-05')).toThrow()
 expect(()=>normalizeReports([],[site,{...site,id:'another'}],'2025-09-05')).toThrow()
 expect(()=>reportUrl(['243','243'],'2025-09-05',1)).toThrow()
 expect(()=>reportUrl(['243'],'2025-09-05',0)).toThrow()
 expect(()=>reportUrl(['243'],'2025-02-30',1)).toThrow()
 expect(normalizeReports([{...row,'Total Volume':false,'Avg mph':[]}],[site],'2025-09-05').observations[0].samples[0]).toMatchObject({totalVolume:null,averageSpeedMph:null})
})
it('retains source slots beyond 95 without asserting a 24-hour UTC day',()=>{
 const r=normalizeReports([{...row,'Time Interval':99,'Time Period Ending':'23:59:59'}],[site],'2025-09-05')
 expect(r.observations[0].samples[0].interval).toBe(99)
 expect(r.clock.completeness).toContain('DST')
})
