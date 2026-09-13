/** Paths integrated through an estimated velocity field. They illustrate the field; they are not
 * observed trajectories of anything. Integration refuses to start from, pass through or land on
 * unsupported field, so a trail ends at a gap instead of crossing it.
 */
export interface FieldPoint {readonly latitude:number;readonly longitude:number}
export interface FieldMovement {readonly value:number;readonly vector:readonly [east:number,north:number];readonly support:number}
/** Reads the field at a place and study time; null or undefined where it is unavailable. */
export type FieldMovementSample=(point:FieldPoint,time:number)=>FieldMovement|null|undefined
export interface FieldTrack {
 /** Study time of the first point. */
 readonly start:number
 readonly level:number
 /** One point per unit step: latitude, longitude and any further channels to interpolate. */
 readonly points:readonly (readonly number[])[]
}
export interface TrailSegment {readonly a:readonly number[];readonly b:readonly number[];readonly tail:number;readonly fade:number;readonly level:number}

const rad=Math.PI/180,kmPerDegree=6371.0088*rad
const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)}

/** Linear blend of two readings. Either side unavailable makes the blend unavailable except at its exact ends. */
export function mixFieldMovement(a:FieldMovement|null|undefined,b:FieldMovement|null|undefined,fraction:number):FieldMovement|null {
 if(fraction===0)return a??null
 if(fraction===1)return b??null
 if(!a||!b)return null
 const mix=(x:number,y:number)=>x*(1-fraction)+y*fraction
 return {value:mix(a.value,b.value),vector:[mix(a.vector[0],b.vector[0]),mix(a.vector[1],b.vector[1])],support:mix(a.support,b.support)}
}
const displace=(p:FieldPoint,v:FieldMovement,seconds:number):FieldPoint=>({
 latitude:p.latitude+v.vector[1]*seconds/1000/kmPerDegree,
 longitude:p.longitude+v.vector[0]*seconds/1000/(kmPerDegree*Math.cos(p.latitude*rad)),
})
/** Explicit midpoint step. Vectors are metres per second; `secondsPerStep` converts one unit of study time. */
export function advanceFieldPath(point:FieldPoint,time:number,step:number,sample:FieldMovementSample,secondsPerStep=300):(FieldPoint&FieldMovement)|null {
 const a=sample(point,time)
 if(!a||a.support<=0)return null
 const mid=displace(point,a,step*secondsPerStep/2),b=sample(mid,time+step/2)
 if(!b||b.support<=0)return null
 const next=displace(point,b,step*secondsPerStep),value=sample(next,time+step)
 return value&&value.support>0?{...next,...value}:null
}
/** The part of a track visible at a study time: the last `trail` steps, with a fade at either end of the track. Scrubbing back restores identical segments. */
export function visibleTrailSegments(track:FieldTrack,index:number,trail=15):TrailSegment[] {
 const end=track.start+track.points.length-1
 if(index<=track.start||index>=end)return []
 const fade=smooth((index-track.start)/2)*smooth((end-index)/3),segments:TrailSegment[]=[]
 for(let i=Math.max(0,Math.floor(index-trail-track.start));i<track.points.length-1;i++){
  const t=track.start+i,a=Math.max(t,index-trail),b=Math.min(t+1,index)
  if(b<=a)continue
  const p=track.points[i],q=track.points[i+1],at=(f:number)=>p.map((v,k)=>v*(1-f)+q[k]*f)
  segments.push({a:at(a-t),b:at(b-t),tail:Math.max(0,1-(index-(a+b)/2)/trail),fade,level:track.level})
 }
 return segments
}
