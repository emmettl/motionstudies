import {it,expect} from 'vitest'
import {pathChainage,pointAlongPath,routeFieldBinsBetween,routeFieldEmphasis,routeFieldValue,type RouteField,type RouteFieldBin} from './route-field.ts'
const bin=(from:number,value:number|null,support=20):RouteFieldBin=>({from,to:from+150,value,support})
it('withholds values without support and never treats them as fine',()=>{
 expect(routeFieldValue(bin(0,0.8),12)).toBe(0.8)
 expect(routeFieldValue(bin(0,0.8,5),12)).toBeNull()
 expect(routeFieldValue(bin(0,null),12)).toBeNull()
 expect(routeFieldValue(bin(0,-1),12)).toBeNull()
 expect(routeFieldValue(undefined,12)).toBeNull()
 expect(routeFieldEmphasis(null)).toBeNull()
})
it('stays quiet at the baseline and grows as the ratio falls',()=>{
 expect(routeFieldEmphasis(1)).toEqual({width:1,glow:0,ring:false})
 expect(routeFieldEmphasis(1.2)).toEqual({width:1,glow:0,ring:false})
 const mild=routeFieldEmphasis(0.95)!,slow=routeFieldEmphasis(0.55)!,floor=routeFieldEmphasis(0.2)!
 expect(mild.glow).toBe(0);expect(mild.width).toBeGreaterThan(1);expect(mild.ring).toBe(false)
 expect(slow.glow).toBeGreaterThan(0);expect(slow.ring).toBe(true)
 expect(floor).toEqual({width:2.6,glow:1,ring:true})
})
it('measures chainage on a local plane and interpolates clamped points',()=>{
 const path:RouteField['path']=[[-2.58,51.46],[-2.58,51.47],[-2.57,51.47]]
 const chain=pathChainage(path)
 expect(chain[0]).toBe(0);expect(Math.round(chain[1])).toBe(1113);expect(Math.round(chain[2]-chain[1])).toBe(693)
 expect(pointAlongPath(path,chain,-5)).toEqual([-2.58,51.46])
 expect(pointAlongPath(path,chain,1e6)).toEqual([-2.57,51.47])
 const mid=pointAlongPath(path,chain,chain[1]/2)!
 expect(mid[0]).toBeCloseTo(-2.58);expect(mid[1]).toBeCloseTo(51.465)
 expect(pathChainage([])).toEqual([]);expect(pointAlongPath([],[],0)).toBeNull();expect(pointAlongPath(path,[0],10)).toBeNull()
})
it('selects bins by overlap in path order',()=>{
 const field:RouteField={id:'m1:0',line:'m1',patternId:'p',direction:'0',metric:'peak-over-off-peak-speed',binMetres:150,minimumSupport:12,
  compared:{subject:{days:['2026-09-16'],hours:[[7,9],[16,18]]},baseline:{days:['2026-09-16'],hours:[[10,15]]}},path:[[0,0],[0,1]],bins:[bin(0,1),bin(150,0.5),bin(300,null)]}
 expect(routeFieldBinsBetween(field,100,320).map(b=>b.from)).toEqual([0,150,300])
 expect(routeFieldBinsBetween(field,150,300).map(b=>b.from)).toEqual([150])
 expect(routeFieldBinsBetween(field,450,600)).toEqual([])
})
