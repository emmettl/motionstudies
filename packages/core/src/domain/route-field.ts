/** A route field is a per-pattern series of bins along a published road path, each holding a ratio of medians
 * over many journeys (peak over off-peak speed, observed over scheduled running time). Values describe the
 * pattern across the stated days and hours, never a single journey, and support counts the sampled intervals
 * that reached the bin. Bins without enough support stay null rather than borrowing a neighbour.
 */
export type RouteFieldMetric='peak-over-off-peak-speed'|'observed-over-scheduled-running-time'
export interface RouteFieldBin {readonly from:number;readonly to:number;readonly value:number|null;readonly support:number}
export interface RouteFieldPeriod {readonly days:readonly string[];readonly hours:readonly (readonly [from:number,to:number])[]}
export interface RouteField {
 readonly id:string
 readonly line:string
 readonly patternId:string
 readonly direction:string
 readonly metric:RouteFieldMetric
 readonly binMetres:number
 readonly minimumSupport:number
 readonly compared:{readonly subject:RouteFieldPeriod;readonly baseline:RouteFieldPeriod}
 readonly path:readonly (readonly [longitude:number,latitude:number])[]
 readonly bins:readonly RouteFieldBin[]
}
export interface RouteFieldEmphasis {readonly width:number;readonly glow:number;readonly ring:boolean}
export interface RouteFieldEmphasisRule {readonly baseline:number;readonly floor:number;readonly ring:number;readonly glowFrom:number}
/** Quiet at the baseline, growing as the ratio falls; a bin below `ring` earns a marker. Mock rule of 18 September 2026. */
export const PEAK_SPEED_EMPHASIS:RouteFieldEmphasisRule={baseline:1,floor:0.4,ring:0.6,glowFrom:0.15}

export function routeFieldValue(bin:RouteFieldBin|undefined,minimumSupport:number):number|null {
 if(!bin||bin.value===null||!Number.isFinite(bin.value)||bin.value<0)return null
 return Number.isFinite(bin.support)&&bin.support>=minimumSupport?bin.value:null
}
/** Null for an unsupported bin; draw it dashed, not as fine. */
export function routeFieldEmphasis(value:number|null,rule:RouteFieldEmphasisRule=PEAK_SPEED_EMPHASIS):RouteFieldEmphasis|null {
 if(value===null||!Number.isFinite(value))return null
 const span=rule.baseline-rule.floor
 const slow=span>0?Math.min(1,Math.max(0,(rule.baseline-value)/span)):0
 return {width:1+1.6*slow,glow:slow>rule.glowFrom?slow:0,ring:value<rule.ring}
}
const EARTH_METRES_PER_DEGREE=111_320
/** Cumulative metres along a longitude/latitude path on a local equirectangular plane; enough for bins of tens of metres. */
export function pathChainage(path:readonly (readonly [longitude:number,latitude:number])[]):readonly number[] {
 const out=[0];if(path.length===0)return []
 for(let i=1;i<path.length;i++){
  const [lon0,lat0]=path[i-1],[lon1,lat1]=path[i]
  const scale=Math.cos(((lat0+lat1)/2)*Math.PI/180)
  out.push(out[i-1]+Math.hypot((lon1-lon0)*EARTH_METRES_PER_DEGREE*scale,(lat1-lat0)*EARTH_METRES_PER_DEGREE))
 }
 return out
}
/** Point at `metres` along the path; clamped to its ends. Returns null for an empty path. */
export function pointAlongPath(path:readonly (readonly [longitude:number,latitude:number])[],chainage:readonly number[],metres:number):readonly [longitude:number,latitude:number]|null {
 if(path.length===0||chainage.length!==path.length)return null
 if(path.length===1||metres<=0)return path[0]
 const end=chainage[chainage.length-1]
 if(metres>=end)return path[path.length-1]
 let hi=1;while(chainage[hi]<metres)hi++
 const lo=hi-1,span=chainage[hi]-chainage[lo],f=span>0?(metres-chainage[lo])/span:0
 return [path[lo][0]+(path[hi][0]-path[lo][0])*f,path[lo][1]+(path[hi][1]-path[lo][1])*f]
}
/** Bins whose extent overlaps [from,to) metres, in path order. */
export function routeFieldBinsBetween(field:RouteField,from:number,to:number):readonly RouteFieldBin[] {
 return field.bins.filter(bin=>bin.to>from&&bin.from<to)
}
