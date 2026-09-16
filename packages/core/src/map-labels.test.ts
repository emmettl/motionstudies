import {expect,it} from 'vitest'
import {mapLabelBudget,mapLabelRankLimit,selectMapLabels,type MapLabelCandidate} from './map-labels.ts'
const viewport={left:0,top:0,right:400,bottom:300}
const candidate=(name:string,rank:number,priority=3,left=10):MapLabelCandidate=>({name,rank,priority,retained:false,distance:0,box:{left,right:left+60,top:10,bottom:54}})
it('gives selection priority over retained labels and rank before allocating collisions',()=>{
 const retained={...candidate('retained',0),retained:true},selected=candidate('selected',100,0)
 expect(selectMapLabels([retained,selected],8,viewport).map(c=>c.name)).toEqual(['selected'])
 expect(selectMapLabels([candidate('small',50),candidate('hub',0)],8,viewport).map(c=>c.name)).toEqual(['hub'])
})
it('keeps retained candidates stable within priority, with deterministic tie-breaking',()=>{
 expect(selectMapLabels([candidate('A',0),{...candidate('B',20),retained:true}],8,viewport)[0].name).toBe('B')
 expect(selectMapLabels([candidate('B',0),candidate('A',0)],8,viewport)[0].name).toBe('A')
})
it('respects the viewport, UI obstacles, full touch boxes and budget even for selected labels',()=>{
 const labels=[candidate('offscreen',0,0,-5),candidate('under-controls',1,0),candidate('visible',2,3,100),candidate('next',3,3,200)]
 expect(selectMapLabels(labels,1,viewport,[{left:0,top:0,right:80,bottom:80}]).map(c=>c.name)).toEqual(['visible'])
 expect(selectMapLabels(labels,0,viewport)).toEqual([])
 expect(selectMapLabels([{...labels[2],box:{...labels[2].box,left:NaN}}],8,viewport)).toEqual([])
})
it('shares progressive station budgets and tier admission',()=>{
 expect([32,25,18,14,10].map(mapLabelBudget)).toEqual([8,20,48,96,96])
 expect([32,25,18,14,10].map(mapLabelRankLimit)).toEqual([8,20,48,96,Infinity])
})
