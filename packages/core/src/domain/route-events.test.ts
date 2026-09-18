import {it,expect} from 'vitest'
import {eventEmphasis,eventPresenceAt,eventsPresentAt,explanationsCovering,type RouteEvent,type RouteEventExplanation} from './route-events.ts'
const event=(start:number,end:number,journeys=10):RouteEvent=>({id:`${start}`,serviceDate:'2026-09-16',start,end,startAt:'2026-09-16T14:42:00Z',endAt:'2026-09-16T20:37:00Z',
 lines:['41','42','43'],journeys,runs:[],centroid:[-2.5074,51.4659],maxOffRouteMetres:960,recurs:false,explanations:[]})
it('appears through a lead-in, holds, then fades after the end',()=>{
 const e=event(56520,77820)
 expect(eventPresenceAt(e,56520-601)).toBe(0)
 expect(eventPresenceAt(e,56520-300)).toBeCloseTo(0.5)
 expect(eventPresenceAt(e,56520)).toBe(1);expect(eventPresenceAt(e,70000)).toBe(1);expect(eventPresenceAt(e,77820)).toBe(1)
 expect(eventPresenceAt(e,77820+900)).toBeCloseTo(0.5)
 expect(eventPresenceAt(e,77820+1800)).toBe(0)
 expect(eventPresenceAt(e,60000,{leadSeconds:0,fadeSeconds:0})).toBe(1);expect(eventPresenceAt(e,77821,{leadSeconds:0,fadeSeconds:0})).toBe(0)
 expect(eventPresenceAt({start:10,end:5},7)).toBe(0);expect(eventPresenceAt(e,Number.NaN)).toBe(0)
})
it('lists present events strongest first and drops absent ones',()=>{
 const a=event(1000,2000),b=event(1500,4000),c=event(9000,9500)
 expect(eventsPresentAt([c,b,a],3000).map(x=>[x.event.id,x.presence])).toEqual([['1500',1],['1000',1-1000/1800]])
 expect(eventsPresentAt([a,b,c],20000)).toEqual([])
})
it('keeps single excursions thin and unlabelled, saturating width for large events',()=>{
 expect(eventEmphasis({journeys:1})).toEqual({width:0.6,labelled:false})
 expect(eventEmphasis({journeys:3})).toEqual({width:1.54,labelled:true})
 expect(eventEmphasis({journeys:75})).toEqual({width:4.6,labelled:true})
})
it('joins explanations only where their validity covers the event',()=>{
 const x=(reference:string,start:string,end:string|null):RouteEventExplanation=>({source:'siri-sx',reference,summary:reference,planned:true,validity:{start,end},lines:['41']})
 const e=event(0,1)
 const covering=explanationsCovering([x('before','2026-09-01T00:00:00Z','2026-09-10T00:00:00Z'),x('open','2026-09-13T23:00:00Z',null),x('window','2026-09-16T18:00:00Z','2026-09-17T05:00:00Z'),x('after','2026-09-18T19:00:00Z','2026-09-19T05:00:00Z'),x('bad','not a date',null)],e)
 expect(covering.map(c=>c.reference)).toEqual(['open','window'])
 expect(explanationsCovering([x('open','2026-09-13T23:00:00Z',null)],{startAt:'x',endAt:'y'})).toEqual([])
})
