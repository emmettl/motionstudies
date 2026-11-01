import { readWeatherField } from '@motionstudies/core/domain/weather-field'

function instant(value) {
  if (typeof value !== 'string') throw new Error('Weather timestamp must be a string')
  const normalized=/Z$|[+-]\d\d:\d\d$/.test(value)?value:value+'Z'
  const date=new Date(normalized)
  if(!Number.isFinite(date.getTime()))throw new Error('Invalid weather timestamp')
  return date.toISOString()
}
function variableTimes(times, variable) {
  if (variable.timeSupport==='instant') return times.map(instant)
  if (!['start','end'].includes(variable.timestampPosition)||!Number.isFinite(variable.intervalSeconds)||variable.intervalSeconds<=0)throw new Error('Explicit weather interval required')
  return times.map(t=>new Date(Date.parse(instant(t))-(variable.timestampPosition==='end'?variable.intervalSeconds*1000:0)).toISOString())
}
function metadata(spec,times,frames,sourceIds) {
  return {unit:spec.unit,evidenceKind:spec.evidenceKind,sourceIds,
    ...(spec.level?{level:spec.level}:{}),timeSupport:spec.timeSupport,
    ...(spec.timeSupport==='instant'?{}:{intervalSeconds:spec.intervalSeconds}),times,frames}
}
/** Compile cached Open-Meteo location responses. No requests, model guessing or unit conversion. */
export function compileOpenMeteoWeather(responses, options) {
  const {grid,sources,sourceIds,variables}=options
  if(!Array.isArray(responses)||responses.length!==grid.width*grid.height)throw new Error('Incomplete weather grid')
  const ordered=new Array(responses.length)
  for(const response of responses){
    if(response.utc_offset_seconds!==0)throw new Error('Weather grid must use UTC')
    const x=(response.longitude-grid.west)/grid.step,y=(response.latitude-grid.south)/grid.step
    if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x-Math.round(x))>1e-4||Math.abs(y-Math.round(y))>1e-4||x<0||y<0||x>grid.width-1||y>grid.height-1)throw new Error('Weather coordinate mismatch')
    const index=Math.round(y)*grid.width+Math.round(x)
    if(ordered[index])throw new Error('Duplicate weather location')
    ordered[index]=response
  }
  const reference=ordered[0].hourly.time
  if(!reference.length||ordered.some(r=>JSON.stringify(r.hourly.time)!==JSON.stringify(reference)))throw new Error('Weather time axes differ')
  const compiled={}
  for(const [key,spec] of Object.entries(variables)){
    for(const response of ordered){
      if(response.hourly_units?.[spec.input]!==spec.unit||response.hourly[spec.input]?.length!==reference.length)throw new Error('Weather units or frame count mismatch')
    }
    compiled[key]=metadata(spec,variableTimes(reference,spec),reference.map((_,i)=>ordered.map(r=>r.hourly[spec.input][i])),sourceIds)
  }
  return readWeatherField({kind:'weather-field',schemaVersion:1,grid,variables:compiled,sources})
}
/** Adapter for an already decoded regular CF/NetCDF scalar raster. Preserve raw file provenance separately. */
export function compileWeatherRaster({longitudes,latitudes,times,frames,variable,key,sources,sourceIds,missingValue}) {
  if(longitudes.length<2||latitudes.length<2)throw new Error('Weather raster axes too short')
  const dx=longitudes[1]-longitudes[0],dy=latitudes[1]-latitudes[0]
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||!dx||!dy||Math.abs(Math.abs(dx)-Math.abs(dy))>1e-8||longitudes.some((x,i)=>!Number.isFinite(x)||Math.abs(x-longitudes[0]-dx*i)>1e-8)||latitudes.some((y,i)=>!Number.isFinite(y)||Math.abs(y-latitudes[0]-dy*i)>1e-8))throw new Error('Weather raster must have regular equal angular steps')
  const width=longitudes.length,height=latitudes.length
  if(frames.length!==times.length||frames.some(frame=>frame.length!==width*height))throw new Error('Weather raster dimensions differ')
  const normalized=frames.map(frame=>Array.from({length:width*height},(_,i)=>{
    const x=i%width,y=Math.floor(i/width),value=frame[(dy<0?height-1-y:y)*width+(dx<0?width-1-x:x)]
    return value===missingValue||value===null?null:value
  }))
  return readWeatherField({kind:'weather-field',schemaVersion:1,
    grid:{west:Math.min(...longitudes),south:Math.min(...latitudes),step:Math.abs(dx),width,height},
    variables:{[key]:metadata(variable,variableTimes(times,variable),normalized,sourceIds)},sources})
}
/** Native percentage packing. Missing stays 255, never clear sky. */
export function packCloudCoverage(values) {
  return Uint8Array.from(values,value=>{
    if(value===null)return 255
    if(!Number.isFinite(value)||value<0||value>100)throw new Error('Invalid cloud coverage')
    return Math.round(value)
  })
}
