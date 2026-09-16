import { test } from 'vitest'
import assert from 'node:assert/strict'
import { cleanTracks, frameAudit } from './europe-air-proof.mjs'
const sample=(time,longitude=5)=>[time,longitude,50,30000,400,'BAW123']
test('a reception gap remains a break despite an otherwise transport-scale track',()=>{
 const result=cleanTracks([{id:'abcdef',samples:[0,10,20,30,120,130,140,150].map(t=>sample(t))}])
 assert.equal(result.tracks.length,2)
 assert.equal(result.counts.gapsOver45Seconds,1)
 assert.deepEqual(result.tracks.map(t=>[t.start,t.end]),[[0,30],[120,150]])
})
test('conflicting observations are excluded and do not bridge adjacent pieces',()=>{
 const result=cleanTracks([{id:'abcdef',samples:[...Array.from({length:9},(_,i)=>sample(i*10)),sample(40,6),sample(0)]}])
 assert.equal(result.counts.conflictingTimestamps,1)
 assert.equal(result.counts.duplicateSamples,1)
 assert.deepEqual(result.tracks.map(t=>[t.start,t.end]),[[0,30],[50,80]])
 assert.ok(result.tracks.every(t=>t.samples.every(p=>p[0]!==40)))
})
test('an implausible position jump splits continuity',()=>{
 const result=cleanTracks([{id:'abcdef',samples:[0,10,20,30].map(t=>sample(t,5)).concat([40,50,60,70].map(t=>sample(t,20)))}])
 assert.equal(result.counts.implausibleJumps,1)
 assert.equal(result.tracks.length,2)
})
test('source frame audit detects missing time independently of aircraft',()=>{
 const bytes=Buffer.alloc(48)
 for(const [i,t] of [0,10,40].entries()){
  bytes.writeUInt32LE(0x0e7f7c9d,i*16)
  const ms=BigInt(Date.parse('2026-09-14T00:00:00Z')+t*1000)
  bytes.writeInt32LE(Number(ms>>32n),i*16+4);bytes.writeUInt32LE(Number(ms&0xffffffffn),i*16+8)
 }
 assert.equal(frameAudit(bytes).largestGap,30)
 assert.throws(()=>frameAudit(bytes.subarray(0,47)),/Malformed/)
})
