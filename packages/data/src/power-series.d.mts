import type { AreaPowerSeries, PowerArea, PowerSeriesDataset, PowerSeriesSource } from '@motionstudies/core/domain/power-series'
export interface PowerColumn extends Omit<AreaPowerSeries,'unit'|'timeSupport'|'intervals'> {
  inputUnit:'MW'|'GW'|'%';intervalSeconds:number;timestampPosition:'start'|'end'
  rows:readonly {timestamp:string;value:number|null;sourceRow:number}[]
}
export function compilePowerSeries(options:{startUtc:string;endUtc:string;scope:string;areas:PowerArea[];sources:PowerSeriesSource[];columns:readonly PowerColumn[]}):PowerSeriesDataset
