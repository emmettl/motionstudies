/** Off-route runs are stretches of recorded positions more than a stated distance from a journey's own matched
 * pattern path. Events cluster runs by place and time within one service day. A persistent place holds runs on
 * every analysed day across most of the day: a long-running diversion or published geometry that disagrees with
 * the road, which detection alone cannot tell apart. Explanations are joined from a disruption source and
 * remain the publisher's statement, not a verified cause.
 */
export interface OffRouteRun {
 readonly line:string
 readonly vehicle:string
 readonly aimedDeparture:string
 readonly patternId:string|null
 readonly start:number
 readonly end:number
 readonly maxOffRouteMetres:number
 readonly between:readonly [from:string,to:string]
 readonly track:readonly (readonly [longitude:number,latitude:number,time:number])[]
}
export interface RouteEventExplanation {
 readonly source:'siri-sx'|'street-manager'|'local-knowledge'
 readonly reference:string
 readonly summary:string
 readonly planned:boolean|null
 readonly validity:{readonly start:string;readonly end:string|null}
 readonly lines:readonly string[]
}
export interface RouteEvent {
 readonly id:string
 readonly serviceDate:string
 /** Service-day seconds, matching the scene clock. */
 readonly start:number
 readonly end:number
 readonly startAt:string
 readonly endAt:string
 readonly lines:readonly string[]
 readonly journeys:number
 readonly runs:readonly OffRouteRun[]
 readonly centroid:readonly [longitude:number,latitude:number]
 readonly maxOffRouteMetres:number
 readonly recurs:boolean
 readonly explanations:readonly RouteEventExplanation[]
}
export interface PersistentPlace {
 readonly id:string
 readonly centroid:readonly [longitude:number,latitude:number]
 readonly days:readonly string[]
 readonly lines:readonly string[]
 readonly runs:number
 readonly explanations:readonly RouteEventExplanation[]
}
export interface RouteEventPresenceRule {readonly leadSeconds:number;readonly fadeSeconds:number}
export const DEFAULT_EVENT_PRESENCE:RouteEventPresenceRule={leadSeconds:600,fadeSeconds:1800}
/** 0 before the lead-in, 1 through the event, fading to 0 after it. Lets a scrubbed day show an event appearing and healing. */
export function eventPresenceAt(event:Pick<RouteEvent,'start'|'end'>,time:number,rule:RouteEventPresenceRule=DEFAULT_EVENT_PRESENCE):number {
 if(!Number.isFinite(time)||event.end<event.start)return 0
 if(time<event.start){const lead=rule.leadSeconds;return lead>0&&time>event.start-lead?(time-(event.start-lead))/lead:0}
 if(time<=event.end)return 1
 const fade=rule.fadeSeconds
 return fade>0&&time<event.end+fade?1-(time-event.end)/fade:0
}
export function eventsPresentAt<T extends Pick<RouteEvent,'start'|'end'>>(events:readonly T[],time:number,rule:RouteEventPresenceRule=DEFAULT_EVENT_PRESENCE):readonly {readonly event:T;readonly presence:number}[] {
 const out:{event:T;presence:number}[]=[]
 for(const event of events){const presence=eventPresenceAt(event,time,rule);if(presence>0)out.push({event,presence})}
 return out.sort((a,b)=>b.presence-a.presence||a.event.start-b.event.start)
}
/** Width grows with journeys and saturates; single excursions stay thin. */
export function eventEmphasis(event:Pick<RouteEvent,'journeys'>):{readonly width:number;readonly labelled:boolean} {
 const journeys=Math.max(0,Math.floor(event.journeys))
 return journeys<3?{width:0.6,labelled:false}:{width:1+0.18*Math.min(journeys,20),labelled:true}
}
/** Explanations whose validity covers the event's window, by ISO instant; an open end counts as still valid. */
export function explanationsCovering(explanations:readonly RouteEventExplanation[],event:Pick<RouteEvent,'startAt'|'endAt'>):readonly RouteEventExplanation[] {
 const start=Date.parse(event.startAt),end=Date.parse(event.endAt)
 if(!Number.isFinite(start)||!Number.isFinite(end))return []
 return explanations.filter(x=>{
  const from=Date.parse(x.validity.start),to=x.validity.end===null?Infinity:Date.parse(x.validity.end)
  return Number.isFinite(from)&&!Number.isNaN(to)&&from<=end&&to>=start
 })
}
