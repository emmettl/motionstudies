import { expect, it } from 'vitest'
import { compileOpenMeteoWeather, compileWeatherRaster, packCloudCoverage } from './weather.mjs'
const sources=[{id:'s',publisher:'Fixture',url:'https://example.org',retrievedAt:'2026-09-17T00:00:00Z',sha256:'a'.repeat(64),license:'CC BY 4.0',attribution:'Fixture'}]
const variable={unit:'W/m²',timeSupport:'interval-mean',intervalSeconds:3600,timestampPosition:'end',evidenceKind:'reanalysis'}
it('normalizes interval ends and input coordinate order without filling nulls',()=>{
 const responses=[[7,47],[6,46],[7,46],[6,47]].map(([longitude,latitude],i)=>({longitude,latitude,utc_offset_seconds:0,hourly_units:{radiation:'W/m²'},hourly:{time:['2026-09-16T01:00'],radiation:[i===0?null:i]}}))
 const f=compileOpenMeteoWeather(responses,{grid:{west:6,south:46,step:1,width:2,height:2},sources,sourceIds:['s'],variables:{radiation:{...variable,input:'radiation'}}})
 expect(f.variables.radiation.times).toEqual(['2026-09-16T00:00:00.000Z']);expect(f.variables.radiation.frames[0]).toEqual([1,2,3,null])
 responses[1].longitude=7;expect(()=>compileOpenMeteoWeather(responses,{grid:f.grid,sources,sourceIds:['s'],variables:{radiation:{...variable,input:'radiation'}}})).toThrow('Duplicate')
})
it('flips descending CF axes and carries explicit nodata',()=>{const f=compileWeatherRaster({longitudes:[7,6],latitudes:[47,46],times:['2026-09-16T01:00Z'],frames:[[-999,2,3,4]],variable,key:'radiation',sources,sourceIds:['s'],missingValue:-999});expect(f.variables.radiation.frames[0]).toEqual([4,3,2,null]);expect(()=>packCloudCoverage([101])).toThrow();expect([...packCloudCoverage([0,100,null,49.7])]).toEqual([0,100,255,50])})
