import {it,expect} from 'vitest'
import {DEFAULT_FIELD_SUPPORT,createFieldGrid,distanceKm,estimateField,fieldNeighbours,sampleFieldGrid,sampleFieldGridAt,type FieldSample} from './supported-field.ts'
const stations=[{latitude:48,longitude:5},{latitude:48,longitude:7}]
const frame=(value:number|null,east:number|null=10,north:number|null=2):FieldSample=>({value,vector:east===null||north===null?null:[east,north]})
const at=(samples:FieldSample[])=>(index:number)=>samples[index]
it('a constant observed field stays constant between stations',()=>{
 for(const longitude of [5,5.5,6,6.5,7])expect(estimateField(fieldNeighbours(stations,48,longitude),at([frame(17),frame(17)])).value).toBeCloseTo(17,9)
})
it('opposing vector components pass through zero without inventing a turn',()=>{
 const result=estimateField(fieldNeighbours(stations,48,6),at([frame(20,10,2),frame(40,-10,-2)]))
 expect(result.value).toBeCloseTo(30,9);expect(result.vector?.[0]).toBeCloseTo(0,9);expect(result.vector?.[1]).toBeCloseTo(0,9)
})
it('missing values are excluded, observed zero remains zero and incomplete vectors stay absent',()=>{
 const n=fieldNeighbours(stations,48,6),zero=estimateField(n,at([frame(0,null,2),frame(null)]))
 expect(zero.value).toBe(0);expect(zero.vector).toBeNull();expect(zero.support).toBeGreaterThan(0);expect(zero.vectorSupport).toBe(0)
 expect(estimateField(n,at([frame(null),frame(null)]))).toEqual({value:null,vector:null,support:0,vectorSupport:0})
 expect(estimateField(n,()=>undefined).value).toBeNull()
})
it('the estimate has finite reach and a withheld station is excluded entirely',()=>{
 expect(estimateField(fieldNeighbours(stations,60,20),at([frame(10),frame(20)])).support).toBe(0)
 const n=fieldNeighbours(stations,48,5,DEFAULT_FIELD_SUPPORT,0)
 expect(n.every((x)=>x.index!==0)).toBe(true)
 expect(estimateField(n,at([frame(1000),frame(20)])).value).toBeCloseTo(20,9)
 expect(distanceKm(stations[0],stations[0])).toBe(0)
})
it('support fades continuously with distance from the nearest available observation, separately for vectors',()=>{
 const single=[stations[0]],samples=[frame(10)]
 const near=estimateField(fieldNeighbours(single,49.2,5),at(samples)),far=estimateField(fieldNeighbours(single,49.8,5),at(samples))
 expect(near.support).toBeGreaterThan(far.support);expect(far.support).toBeGreaterThan(0);expect(near.value).toBeCloseTo(far.value!,9)
 const vectorless=estimateField(fieldNeighbours(stations,48,5.1),at([frame(10,null,null),frame(10)]))
 expect(vectorless.vectorSupport).toBeLessThan(vectorless.support);expect(vectorless.vector).toEqual([10,2])
})
it('kernel scales are options rather than constants',()=>{
 const wide={scaleKm:600,reachKm:2000,reachStartKm:1500,supportFarKm:2000,supportNearKm:1000}
 expect(fieldNeighbours(stations,60,20).length).toBe(0);expect(fieldNeighbours(stations,60,20,wide).length).toBe(2)
 expect(estimateField(fieldNeighbours(stations,60,20,wide),at([frame(10),frame(20)]),wide).support).toBeGreaterThan(0)
})
it('grid rows run south to north, levels pack separately and unavailable cells are NaN',()=>{
 const grid=createFieldGrid(stations,{west:5,east:7,south:48,north:49,step:1})
 expect(grid.width).toBe(3);expect(grid.height).toBe(2);expect(grid.cells[3].latitude).toBe(49)
 const data=sampleFieldGrid(grid,(_index,level)=>frame(level===1?90:10),2)
 expect(data.length).toBe(3*2*2*4);expect(data[0]).toBeCloseTo(10,6);expect(data[6*4]).toBeCloseTo(90,6);expect(data[3]).toBeGreaterThan(0)
 const gaps=sampleFieldGrid(grid,()=>frame(null),1)
 expect(gaps.every(Number.isNaN)).toBe(true)
})
it('movement grids withhold cells without a vector; value grids keep the value and mark the vector unavailable',()=>{
 const bounds={west:7,east:8,south:48,north:49,step:1},grid=createFieldGrid([{latitude:48,longitude:7}],bounds)
 const noVector=(index:number)=>index===0?frame(20,null,3):null
 const movement=sampleFieldGrid(grid,noVector,1,DEFAULT_FIELD_SUPPORT,true),values=sampleFieldGrid(grid,noVector,1)
 expect(sampleFieldGridAt(movement,grid,48,7,0)).toBeNull()
 expect(sampleFieldGridAt(values,grid,48,7,0)).toEqual({value:20,vector:null,support:1})
 const field=new Float32Array(4*4);field.fill(NaN);field.set([20,10,0,1])
 expect(sampleFieldGridAt(field,grid,48,7,0)?.vector).toEqual([10,0])
 expect(sampleFieldGridAt(field,grid,48.5,7.5,0)).toBeNull();expect(sampleFieldGridAt(field,grid,48,6,0)).toBeNull();expect(sampleFieldGridAt(field,grid,48,7,1)).toBeNull()
})
