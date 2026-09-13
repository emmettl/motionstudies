import {it,expect} from 'vitest'
import {advanceFieldPath,mixFieldMovement,visibleTrailSegments,type FieldMovement,type FieldTrack} from './field-paths.ts'
import {distanceKm} from './supported-field.ts'
const movement=(east:number,north:number,support=1):FieldMovement=>({value:20,vector:[east,north],support})
const start={latitude:48,longitude:7}
it('east and north vectors travel the correct distance on the study clock',()=>{
 const east=advanceFieldPath(start,0,1,()=>movement(10,0))!,north=advanceFieldPath(start,0,1,()=>movement(0,10))!
 expect(east.latitude).toBe(start.latitude);expect(east.longitude).toBeGreaterThan(start.longitude)
 expect(north.longitude).toBe(start.longitude);expect(north.latitude).toBeGreaterThan(start.latitude)
 expect(distanceKm(start,east)).toBeCloseTo(3,3);expect(distanceKm(start,north)).toBeCloseTo(3,3)
 expect(distanceKm(start,advanceFieldPath(start,0,1,()=>movement(10,0),60)!)).toBeCloseTo(.6,3)
 expect(advanceFieldPath(start,0,1,()=>movement(0,0))).toEqual({...start,...movement(0,0)})
})
it('integration follows changing vectors and stops at gaps or unsupported field instead of crossing them',()=>{
 const turn=advanceFieldPath(start,0,1,(_p,t)=>movement(10*(1-t),10*t))!
 expect(turn.latitude).toBeGreaterThan(48);expect(turn.longitude).toBeGreaterThan(7);expect(distanceKm(start,turn)).toBeCloseTo(Math.sqrt(4.5),3)
 expect(advanceFieldPath(start,0,1,(_p,t)=>t===.5?null:movement(10,0))).toBeNull()
 expect(advanceFieldPath(start,0,1,(_p,t)=>t===1?undefined:movement(10,0))).toBeNull()
 expect(advanceFieldPath(start,0,1,()=>movement(10,0,0))).toBeNull()
})
it('blends keep unavailable sides unavailable except at exact ends',()=>{
 expect(mixFieldMovement(movement(10,0),null,.5)).toBeNull()
 expect(mixFieldMovement(movement(10,0),null,0)?.vector[0]).toBe(10)
 expect(mixFieldMovement(null,movement(4,6),1)?.vector).toEqual([4,6])
 expect(mixFieldMovement(movement(10,0,1),movement(0,10,0),.5)).toEqual({value:20,vector:[5,5],support:.5})
})
it('trails truncate at the current clock and restore identically when scrubbing back',()=>{
 const track:FieldTrack={start:0,level:2,points:Array.from({length:10},(_,i)=>[48,7+i*.01,20,1])}
 const first=visibleTrailSegments(track,4.5,2);visibleTrailSegments(track,7,2)
 expect(visibleTrailSegments(track,4.5,2)).toEqual(first)
 expect(first[0].a[1]).toBeCloseTo(7.025,12);expect(first[first.length-1].b[1]).toBeCloseTo(7.045,12);expect(first[0].level).toBe(2)
 expect(visibleTrailSegments(track,0)).toEqual([]);expect(visibleTrailSegments(track,9)).toEqual([])
})
