import {it,expect} from 'vitest'
import {cellKey,cellOf,fetchTransport,inflateIfGzipped,journeyAt,openPublishedDay,partFor,positionAt,sliceNameAt,sliceStart,type DayTransport,type Pack} from './published-day.ts'

const gz=async(text:string)=>new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())
const t0=Date.parse('2026-09-15T00:00:00Z')/1000
const packA:Pack={date:'2026-09-15',operator:'OPA',part:0,parts:2,vehicles:{'1':{track:[[t0+60,-2.60,51.45],[t0+120,-2.61,51.45],[t0+3600,-2.60,51.55]],journeys:[[t0+60,'1','j1'],[t0+120,'2','j2'],[t0+3600,'1','j1']]}}}
const packB:Pack={date:'2026-09-15',operator:'OPB',part:0,parts:1,vehicles:{'9':{track:[[t0+420,-1.5,52.4]],journeys:[[t0+420,'1','j1']]}}}
const files:Record<string,string|Uint8Array>={
 'manifest.json':JSON.stringify({date:'2026-09-15',compiledAt:'now',hours:{present:['2026-09-15T00'],missing:[]},stats:{samples:5,vehicles:3,operators:2,slices:2,excludedRejected:0,excludedOutsideDay:0},slices:2,files:7,bytes:1,list:[{path:'slices/00-05.json',bytes:1},{path:'slices/00-00.json',bytes:1},{path:'members/00-00.json',bytes:1},{path:'packs/OPA.0.json.gz',bytes:1}]}),
 'index.json':JSON.stringify({date:'2026-09-15',operators:[{ref:'OPA',vehicles:3,samples:5,parts:[{file:'packs/OPA.0.json.gz',bytes:1,vehicles:1,samples:3,refs:['1']},{file:'packs/OPA.1.json.gz',bytes:1,vehicles:2,samples:2,refs:['2','3']}]},{ref:'OPB',vehicles:1,samples:1,parts:[{file:'packs/OPB.json.gz',bytes:1,vehicles:1,samples:1}]}]}),
 'slices/00-00.json':JSON.stringify({slice:'2026-09-15T00:00:00Z',cells:[[-2.7,51.4,2,2],[-2.6,51.4,1,1]]}),
 'members/00-00.json':JSON.stringify({slice:'2026-09-15T00:00:00Z',cells:{'-2.7,51.4':[[0,'1'],[0,'2']],'-2.6,51.4':[[0,'1']]}}),
 'packs/OPA.0.json.gz':await gz(JSON.stringify(packA)),'packs/OPB.json.gz':await gz(JSON.stringify(packB)),
}
const loads:string[]=[]
const transport:DayTransport={text:async p=>{loads.push(p);const f=files[p];if(typeof f!=='string')throw new Error('missing '+p);return f},bytes:async p=>{loads.push(p);const f=files[p];if(!(f instanceof Uint8Array))throw new Error('missing '+p);return f}}

it('names slices and cells exactly as the compiler does',()=>{
 expect(sliceNameAt('2026-09-15T00:04:59Z')).toBe('00-00');expect(sliceNameAt('2026-09-15T23:55:00Z')).toBe('23-55');expect(sliceStart('2026-09-15','23-55')).toBe('2026-09-15T23:55:00Z')
 expect(()=>sliceNameAt('nonsense')).toThrow()
 expect(cellOf(-2.60,51.45)).toEqual([-2.6,51.4]);expect(cellOf(-2.61,51.45)).toEqual([-2.7,51.4]);expect(cellOf(-2.62,51.46)).toEqual([-2.7,51.4])
 expect(cellKey(...cellOf(0.05,51.95))).toBe('0.0,51.9')
})
it('opens a day, reads slices and members on demand, resolves a vehicle to its pack part and inflates it once',async()=>{
 const day=await openPublishedDay(transport)
 expect(day.sliceNames).toEqual(['00-00','00-05']);expect(day.manifest.stats.vehicles).toBe(3)
 expect((await day.slice('00-00')).cells[0]).toEqual([-2.7,51.4,2,2])
 const members=await day.members('00-00');expect(members.cells['-2.7,51.4'].map(([i,v])=>`${day.index.operators[i].ref}/${v}`)).toEqual(['OPA/1','OPA/2'])
 expect(partFor(day.index,'OPA','3')?.file).toBe('packs/OPA.1.json.gz');expect(partFor(day.index,'OPB','9')?.file).toBe('packs/OPB.json.gz');expect(partFor(day.index,'OPA','nope')).toBeNull();expect(partFor(day.index,'ZZZ','1')).toBeNull()
 const v=await day.vehicle('OPA','1');expect(v?.track.length).toBe(3);await day.vehicle('OPA','1');await day.pack('OPA','1')
 expect(loads.filter(p=>p==='packs/OPA.0.json.gz').length).toBe(1)
 expect(await day.vehicle('OPB','missing')).toBeNull();expect(await day.vehicle('ZZZ','1')).toBeNull()
 await expect(day.pack('OPA','3')).rejects.toThrow('missing packs/OPA.1.json.gz')
})
it('interpolates positions inside tolerated gaps only, and finds the journey run at an instant',()=>{
 const {track,journeys}=packA.vehicles['1']
 expect(positionAt(track,t0+90)).toEqual([-2.605,51.45]);expect(positionAt(track,t0+60)).toEqual([-2.6,51.45]);expect(positionAt(track,t0+3600)).toEqual([-2.6,51.55])
 expect(positionAt(track,t0+1800)).toBeNull();const mid=positionAt(track,t0+1800,7200)!;expect(mid[0]).toBeCloseTo(-2.6052,3);expect(mid[1]).toBeCloseTo(51.4983,3);expect(positionAt(track,t0)).toBeNull();expect(positionAt(track,t0+9999)).toBeNull();expect(positionAt([],t0)).toBeNull()
 expect(journeyAt(journeys,t0+90)).toEqual([t0+60,'1','j1']);expect(journeyAt(journeys,t0+130)?.[1]).toBe('2');expect(journeyAt(journeys,t0)).toBeNull()
})
it('bytes already decoded by a server that declared the encoding pass through untouched',async()=>{
 const plain=new TextEncoder().encode('{"x":1}'),calls:number[]=[]
 const inflate=async(b:Uint8Array)=>{calls.push(b.length);return plain}
 expect(await inflateIfGzipped(plain,inflate)).toBe(plain);expect(calls).toEqual([])
 expect(await inflateIfGzipped(await gz('{"x":1}'),inflate)).toBe(plain);expect(calls.length).toBe(1)
})
it('the fetch transport reads text and bytes under a base and surfaces HTTP failures by path',async()=>{
 const fetchImpl=async(u:string)=>u.endsWith('/manifest.json')?new Response('{"a":1}'):new Response(null,{status:404})
 const t=fetchTransport('https://x.example/day/',fetchImpl)
 expect(await t.text('manifest.json')).toBe('{"a":1}');await expect(t.bytes('packs/x.gz')).rejects.toThrow('packs/x.gz returned HTTP 404')
})
