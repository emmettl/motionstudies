import { sampleGriddedSeries, type GriddedSeriesGrid, type TimeBracket } from './gridded-series.ts'

export interface WeatherSource {
  id: string; publisher: string; url: string; retrievedAt: string; sha256: string
  license: string; attribution: string
}
export type WeatherTimeSupport = 'instant' | 'interval-mean' | 'interval-total'
export interface WeatherVariable {
  /** Source units, never inferred from the variable name. */
  unit: string
  evidenceKind: 'observation' | 'satellite-derived' | 'reanalysis' | 'forecast'
  sourceIds: string[]
  level?: { value: number; unit: string; reference: string }
  timeSupport: WeatherTimeSupport
  /** UTC instants, or interval starts for interval quantities. */
  times: string[]
  intervalSeconds?: number
  /** One south-to-north, west-to-east frame per time. Null is unavailable. */
  frames: (number | null)[][]
}
export interface WeatherField {
  kind: 'weather-field'; schemaVersion: 1
  grid: GriddedSeriesGrid
  variables: Record<string, WeatherVariable>
  sources: WeatherSource[]
}
const requireValue: (ok: unknown, message: string) => asserts ok = (ok, message) => {
  if (!ok) throw new Error(`Invalid weather field: ${message}`)
}
const stamp = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,19) === value.slice(0,19)
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

/** Validate at an evidence boundary, not every animation frame. No provider calls. */
export function readWeatherField(input: unknown): WeatherField {
  requireValue(input && typeof input === 'object', 'object')
  const f = input as WeatherField
  requireValue(f.kind === 'weather-field' && f.schemaVersion === 1, 'schema')
  const g = f.grid
  requireValue(g && [g.west,g.south,g.step].every(Number.isFinite) && g.step > 0 && Number.isInteger(g.width) && Number.isInteger(g.height) && g.width >= 2 && g.height >= 2 && g.width*g.height <= 1_000_000, 'grid')
  requireValue(g.west >= -180 && g.west+(g.width-1)*g.step <= 180 && g.south >= -90 && g.south+(g.height-1)*g.step <= 90, 'grid bounds')
  requireValue(Array.isArray(f.sources) && f.sources.length > 0, 'sources')
  const ids = new Set<string>()
  for (const s of f.sources) {
    requireValue(s && text(s.id) && !ids.has(s.id) && text(s.publisher) && /^https?:\/\//.test(s.url) && stamp(s.retrievedAt) && /^[a-f0-9]{64}$/.test(s.sha256) && text(s.license) && text(s.attribution), 'source provenance')
    ids.add(s.id)
  }
  requireValue(f.variables && typeof f.variables === 'object' && !Array.isArray(f.variables) && Object.keys(f.variables).length > 0, 'variables')
  for (const [key,v] of Object.entries(f.variables)) {
    requireValue(text(key) && v && text(v.unit) && ['observation','satellite-derived','reanalysis','forecast'].includes(v.evidenceKind), 'variable metadata')
    requireValue(Array.isArray(v.sourceIds) && v.sourceIds.length > 0 && new Set(v.sourceIds).size === v.sourceIds.length && v.sourceIds.every(id => ids.has(id)), 'variable sources')
    requireValue(['instant','interval-mean','interval-total'].includes(v.timeSupport), 'time support')
    requireValue(v.timeSupport === 'instant' ? v.intervalSeconds === undefined : Number.isFinite(v.intervalSeconds) && v.intervalSeconds! > 0, 'interval duration')
    requireValue(!v.level || Number.isFinite(v.level.value) && text(v.level.unit) && text(v.level.reference), 'level')
    requireValue(Array.isArray(v.times) && v.times.length > 0 && v.times.every(stamp), 'UTC times')
    requireValue(v.times.every((t,i) => !i || Date.parse(t)-Date.parse(v.times[i-1]) >= (v.timeSupport === 'instant' ? 1 : v.intervalSeconds!*1000)), 'ordered non-overlapping times')
    requireValue(Array.isArray(v.frames) && v.frames.length === v.times.length && v.frames.every(frame => Array.isArray(frame) && frame.length === g.width*g.height && frame.every(n => n === null || typeof n === 'number' && Number.isFinite(n))), 'frames')
  }
  return f
}

export interface WeatherReading {
  value: number; unit: string; timeSupport: WeatherTimeSupport
  /** Native evidence span, not a claim of additional observations. */
  from: string; to: string; interpolated: boolean; sourceIds: readonly string[]
}
/** A shared clock policy for CPU reads and GPU frame uploads. */
export function weatherFramePair(v: Pick<WeatherVariable,'times'|'timeSupport'|'intervalSeconds'>, time: string | number): TimeBracket | null {
  const now = typeof time === 'number' ? time : Date.parse(time)
  if (!Number.isFinite(now)) return null
  let a = -1
  for (let i=0;i<v.times.length && Date.parse(v.times[i])<=now;i++) a=i
  if (a<0) return null
  const exact = now === Date.parse(v.times[a])
  const b = v.timeSupport === 'instant' && !exact ? a+1 : a
  if (b>=v.times.length || v.timeSupport !== 'instant' && (!Number.isFinite(v.intervalSeconds) || now>=Date.parse(v.times[a])+v.intervalSeconds!*1000)) return null
  return {a,b,fraction:b===a?0:(now-Date.parse(v.times[a]))/(Date.parse(v.times[b])-Date.parse(v.times[a]))}
}
/** Instant fields interpolate; interval quantities hold their native value on [start,end). */
export function sampleWeather(field: WeatherField, key: string, latitude: number, longitude: number, time: string | number): WeatherReading | null {
  const v = Object.hasOwn(field.variables,key) ? field.variables[key] : undefined
  const pair=v?weatherFramePair(v,time):null
  if(!v||!pair)return null
  const {a,b}=pair
  const now=typeof time==='number'?time:Date.parse(time)
  const series = {grid:field.grid,times:b===a?[v.times[a]]:[v.times[a],v.times[b]],frames:(b===a?[a]:[a,b]).map(i=>({value:v.frames[i]}))}
  const value = sampleGriddedSeries(series,'value',latitude,longitude,v.timeSupport === 'instant' ? now : v.times[a])
  return value === null ? null : {value,unit:v.unit,timeSupport:v.timeSupport,from:v.times[a],to:v.timeSupport==='instant'?v.times[b]:new Date(Date.parse(v.times[a])+v.intervalSeconds!*1000).toISOString(),interpolated:b!==a,sourceIds:v.sourceIds}
}

/** Meteorological direction is where wind comes FROM; output is east/north m/s. */
export function windFromDirection(speed: number | null, degrees: number | null): readonly [number,number] | null {
  if (speed === null || degrees === null || !Number.isFinite(speed) || speed<0 || !Number.isFinite(degrees) || degrees<0 || degrees>360) return null
  const angle=degrees*Math.PI/180
  return [-speed*Math.sin(angle),-speed*Math.cos(angle)]
}

/** Percentage/validity byte encoding; missing cells retain a separate alpha mask. */
export function cloudCoveragePixels(values: Uint8Array, frame: number, cells: number): Uint8Array {
  if(!Number.isInteger(cells)||cells<1||values.length%cells!==0||!Number.isInteger(frame)||frame<0||frame>=values.length/cells)throw new Error('Invalid coverage frame')
  const pixels=new Uint8Array(cells*4)
  for(let i=0;i<cells;i++){
    const value=values[frame*cells+i]
    if(value>100&&value!==255)throw new Error('Invalid cloud coverage')
    pixels[i*4]=value===255?0:Math.round(value*2.55)
    pixels[i*4+3]=value===255?0:255
  }
  return pixels
}

/** Paired components only: different units, heights, evidence kinds or native spans cannot create a vector. */
export function weatherWindAt(field: WeatherField, eastKey: string, northKey: string, latitude: number, longitude: number, time: string | number): readonly [number,number] | null {
  const east=field.variables[eastKey],north=field.variables[northKey]
  if(!east||!north||east.unit!=='m/s'||north.unit!=='m/s'||east.evidenceKind!==north.evidenceKind||JSON.stringify(east.level)!==JSON.stringify(north.level)||east.timeSupport!==north.timeSupport||JSON.stringify(east.times)!==JSON.stringify(north.times)||east.intervalSeconds!==north.intervalSeconds)return null
  const u=sampleWeather(field,eastKey,latitude,longitude,time),v=sampleWeather(field,northKey,latitude,longitude,time)
  return u&&v?[u.value,v.value]:null
}
