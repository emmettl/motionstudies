import {it,expect} from 'vitest'
import {bracketTime,meanGriddedSeries,sampleGriddedSeries,type GriddedSeries} from './gridded-series.ts'
const times=['2018-09-04T23:00:00Z','2018-09-05T00:00:00Z']
const series:GriddedSeries<'cover'|'low'>={times,grid:{west:0,south:0,step:1,width:2,height:2},frames:[{cover:[0,20,40,60]},{cover:[40,60,80,100]}]}
const withMissing=():GriddedSeries<'cover'|'low'>=>({...series,frames:[series.frames[0],{cover:[null,60,80,100]}]})
it('brackets interpolate across midnight, keep exact endpoints and reject instants outside the series',()=>{
 expect(bracketTime(times,'2018-09-04T23:30:00Z')).toEqual({a:0,b:1,fraction:.5})
 expect(bracketTime(times,times[1])).toEqual({a:1,b:1,fraction:0})
 expect(bracketTime(times,Date.parse(times[0]))).toEqual({a:0,b:0,fraction:0})
 expect(bracketTime(times,'2018-09-05T00:01:00Z')).toBeNull();expect(bracketTime([],times[0])).toBeNull();expect(bracketTime(times,'nonsense')).toBeNull()
})
it('samples preserve observed zeros, spatial corners and bilinear means',()=>{
 expect(sampleGriddedSeries(series,'cover',0,0,times[0])).toBe(0)
 expect(sampleGriddedSeries(series,'cover',1,1,times[1])).toBe(100)
 expect(sampleGriddedSeries(series,'cover',.5,.5,'2018-09-04T23:30:00Z')).toBe(50)
 expect(sampleGriddedSeries(series,'cover',-.01,.5,times[0])).toBeNull()
 expect(sampleGriddedSeries(series,'low',0,0,times[0])).toBeNull()
})
it('missing samples are not bridged; zero-weight neighbours do not hide valid samples',()=>{
 const missing=withMissing()
 expect(sampleGriddedSeries(missing,'cover',0,0,times[0])).toBe(0)
 expect(sampleGriddedSeries(missing,'cover',0,0,'2018-09-04T23:30:00Z')).toBeNull()
 expect(sampleGriddedSeries(missing,'cover',1,1,times[1])).toBe(100)
})
it('the mean weights area, interpolates time, and keeps missing or out-of-range data distinct from zero',()=>{
 const rowWeight=Math.cos(Math.PI/180),mean=(20+100*rowWeight)/(2+2*rowWeight)
 expect(meanGriddedSeries(series,'cover',times[0])).toBeCloseTo(mean,10)
 expect(meanGriddedSeries(series,'cover','2018-09-04T23:30:00Z')).toBeCloseTo(mean+20,10)
 const missing=withMissing()
 expect(meanGriddedSeries(missing,'cover','2018-09-04T23:30:00Z')).toBeNull()
 expect(meanGriddedSeries(missing,'cover',times[0])).toBe(meanGriddedSeries(series,'cover',times[0]))
 expect(meanGriddedSeries(series,'low',times[0])).toBeNull()
 expect(meanGriddedSeries(series,'cover','2018-09-05T01:00:00Z')).toBeNull()
 expect(meanGriddedSeries(series,'cover',times[1],[0,80])).toBeNull()
 expect(meanGriddedSeries({...series,frames:[{cover:[0,0,0,0]},series.frames[1]]},'cover',times[0])).toBe(0)
})
