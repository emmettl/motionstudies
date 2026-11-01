import type { WeatherField, WeatherSource, WeatherVariable, WeatherTimeSupport } from '@motionstudies/core/domain/weather-field'
import type { GriddedSeriesGrid } from '@motionstudies/core/domain/gridded-series'
export interface WeatherVariableSpec {
  unit: string; evidenceKind: WeatherVariable['evidenceKind']; timeSupport: WeatherTimeSupport
  intervalSeconds?: number; timestampPosition?: 'start' | 'end'; level?: WeatherVariable['level']
}
export interface OpenMeteoLocation {
  latitude: number; longitude: number; utc_offset_seconds: number
  hourly_units: Record<string,string>; hourly: {time:string[]} & Record<string,(number|null)[]|string[]>
}
export function compileOpenMeteoWeather(responses: readonly OpenMeteoLocation[], options: {
  grid:GriddedSeriesGrid; sources:WeatherSource[]; sourceIds:string[]
  variables:Record<string,WeatherVariableSpec & {input:string}>
}):WeatherField
export function compileWeatherRaster(options: {
  longitudes:readonly number[]; latitudes:readonly number[]; times:readonly string[]
  frames:readonly (readonly (number|null)[])[]; key:string; variable:WeatherVariableSpec
  sources:WeatherSource[]; sourceIds:string[]; missingValue?:number
}):WeatherField
export function packCloudCoverage(values: readonly (number|null)[]):Uint8Array
