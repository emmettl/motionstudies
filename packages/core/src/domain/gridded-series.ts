/** A regular latitude/longitude grid of one or more variables at listed instants, such as cloud
 * cover, rainfall or a model wind component. Values keep the source's own units; null marks a
 * missing sample. Readings interpolate bilinearly in space and linearly in time, and a missing
 * sample with any weight makes the whole reading unavailable rather than bridging the gap.
 */
export interface GriddedSeriesGrid {readonly west:number;readonly south:number;readonly step:number;readonly width:number;readonly height:number}
export interface GriddedSeries<K extends string=string> {
 /** ISO instants in ascending order. */
 readonly times:readonly string[]
 readonly grid:GriddedSeriesGrid
 /** One frame per instant; rows run south to north. */
 readonly frames:readonly Readonly<Partial<Record<K,readonly (number|null)[]>>>[]
}
export interface TimeBracket {readonly a:number;readonly b:number;readonly fraction:number}

/** The adjacent frames around an instant. Exact instants bracket themselves; instants outside the series are null. */
export function bracketTime(times:readonly string[],time:string|number):TimeBracket|null {
 const value=typeof time==='number'?time:Date.parse(time)
 if(!times.length||!Number.isFinite(value)||value<Date.parse(times[0])||value>Date.parse(times[times.length-1]))return null
 for(let i=0;i<times.length;i++){
  const stamp=Date.parse(times[i])
  if(value===stamp)return {a:i,b:i,fraction:0}
  if(stamp>value)return {a:i-1,b:i,fraction:(value-Date.parse(times[i-1]))/(stamp-Date.parse(times[i-1]))}
 }
 return null
}
const valid=(sample:number|null|undefined,range?:readonly [number,number]):sample is number=>
 typeof sample==='number'&&Number.isFinite(sample)&&(!range||(sample>=range[0]&&sample<=range[1]))

/** One variable at a place and instant, or null outside the grid, outside the times, or beside a missing sample. */
export function sampleGriddedSeries<K extends string>(series:GriddedSeries<K>,key:K,latitude:number,longitude:number,time:string|number):number|null {
 const bracket=bracketTime(series.times,time),{west,south,step,width,height}=series.grid,x=(longitude-west)/step,y=(latitude-south)/step
 if(!bracket||!(x>=0&&y>=0&&x<=width-1&&y<=height-1))return null
 const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0
 let value=0
 for(const [t,wt] of [[bracket.a,1-bracket.fraction],[bracket.b,bracket.fraction]]){
  for(const [ix,wx] of [[x0,1-fx],[Math.min(x0+1,width-1),fx]])for(const [iy,wy] of [[y0,1-fy],[Math.min(y0+1,height-1),fy]]){
   const weight=wt*wx*wy
   if(weight===0)continue
   const sample=series.frames[t]?.[key]?.[iy*width+ix]
   if(!valid(sample))return null
   value+=sample*weight
  }
 }
 return value
}
/** Area-weighted mean of one variable over the whole grid at an instant. Any missing or out-of-range weighted sample makes the mean unavailable. */
export function meanGriddedSeries<K extends string>(series:GriddedSeries<K>,key:K,time:string|number,range?:readonly [number,number]):number|null {
 const bracket=bracketTime(series.times,time)
 if(!bracket)return null
 const {south,step,width,height}=series.grid
 let sum=0,weight=0
 for(let y=0;y<height;y++){
  const area=Math.cos((south+y*step)*Math.PI/180)
  for(let x=0;x<width;x++){
   let value=0
   for(const [frame,w] of [[bracket.a,1-bracket.fraction],[bracket.b,bracket.fraction]]){
    if(w===0)continue
    const sample=series.frames[frame]?.[key]?.[y*width+x]
    if(!valid(sample,range))return null
    value+=sample*w
   }
   sum+=value*area;weight+=area
  }
 }
 return weight?sum/weight:null
}
