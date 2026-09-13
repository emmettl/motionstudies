/** Counts are vehicle passages at a detector or a provider-defined link, not vehicle identities. */
export type AggregateRoadInterval =
  | {readonly kind:'provider-slot';readonly serviceDate:string;readonly index:number;readonly endingLabel:string}
  | {readonly kind:'utc';readonly from:string;readonly to:string}
export interface AggregateRoadSample {
 readonly interval:AggregateRoadInterval
 readonly vehicleCount:number|null
 readonly averageSpeed:{readonly value:number;readonly unit:'mph'|'km/h'}|null
 readonly sourceRecordIds:readonly string[]
}
export interface AggregateRoadSeries {
 readonly id:string
 readonly provider:string
 readonly dataset:string
 readonly siteId:string
 readonly modelVersion?:string
 readonly samples:readonly AggregateRoadSample[]
}
/** Geometry association is independent of measurements; a candidate is not a verified link. */
export interface AggregateRoadSection {
 readonly id:string
 readonly seriesId:string
 readonly path:readonly (readonly [longitude:number,latitude:number])[]
 readonly association:
  | {readonly kind:'illustrative';readonly method:string;readonly maximumDistanceMetres:number}
  | {readonly kind:'provider-link';readonly linkId:string;readonly modelVersion:string}
}
export function aggregateRoadValue(sample:AggregateRoadSample|undefined,metric:'vehicleCount'|'averageSpeed'):number|null {
 const value=metric==='vehicleCount'?sample?.vehicleCount:sample?.averageSpeed?.value
 return typeof value==='number'&&Number.isFinite(value)&&value>=0&&(metric!=='vehicleCount'||Number.isInteger(value))?value:null
}
/** Compile once per immutable series. Conflicting or duplicate slots remain unavailable.
 * No interpolation, nearest-slot fallback or conversion between provider and UTC clocks.
 */
export function indexAggregateRoadSlots(series:AggregateRoadSeries,serviceDate:string):ReadonlyMap<number,AggregateRoadSample> {
 const result=new Map<number,AggregateRoadSample>(),conflicts=new Set<number>()
 for(const sample of series.samples){
  const interval=sample.interval
  if(interval.kind!=='provider-slot'||interval.serviceDate!==serviceDate||!Number.isSafeInteger(interval.index)||interval.index<0)continue
  if(result.has(interval.index)){result.delete(interval.index);conflicts.add(interval.index)}
  else if(!conflicts.has(interval.index))result.set(interval.index,sample)
 }
 return result
}
