import {it as test,onTestFinished} from 'vitest'
import assert from 'node:assert/strict'
import {mkdtemp,rm,readdir,readFile,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {gzipSync} from 'node:zlib'
import {capture,readCapture,readObject,compactObjects,importCapture,jsonDocument,sha256} from './source-store.mjs'
const source={id:'fixture',publisher:'Synthetic source',kind:'test',documentation:'https://example.test',license:'Test only',origins:['https://example.test']}
const url='https://example.test/feed.json'
async function temporary() { const root=await mkdtemp(join(tmpdir(),'source-store-')); onTestFinished(()=>rm(root,{recursive:true,force:true})); return root }
const compressible=Buffer.from(JSON.stringify({rows:Array.from({length:2000},(_,i)=>({id:i,name:'a repeated value',value:i%7}))}))

test('gzip at rest keeps the raw hash and byte count as identity, stores fewer bytes, and reads back transparently with integrity',async()=>{
  const store=await temporary()
  const first=await capture({store,source,url,fetchImpl:async()=>new Response(compressible),compression:'gzip',validate:jsonDocument})
  assert.equal(first.record.sha256,sha256(compressible)); assert.equal(first.record.bytes,compressible.length); assert.equal(first.record.encoding,'gzip'); assert.ok(first.record.storedBytes<compressible.length/5)
  const names=await readdir(join(store,'objects')); assert.deepEqual(names,[`${first.record.sha256}.gz`],'only the compressed object exists')
  const replay=await capture({store,source,url,offline:true,fetchImpl:()=>{throw new Error('no network')},validate:jsonDocument})
  assert.ok(replay.bytes.equals(compressible)); assert.equal(replay.cached,true)
  assert.ok((await readObject(store,first.record.sha256,first.record.bytes)).equals(compressible))
  await writeFile(join(store,'objects',`${first.record.sha256}.gz`),gzipSync(Buffer.from('tampered')))
  await assert.rejects(readCapture(store,source,url),/integrity/)
  await writeFile(join(store,'objects',`${first.record.sha256}.gz`),Buffer.from('not gzip'))
  await assert.rejects(readCapture(store,source,url),/could not be expanded/)
})
test('incompressible bytes stay raw even when compression is requested; unknown compression is refused; imports accept it too',async()=>{
  const store=await temporary(), random=Buffer.alloc(4096); for(let i=0;i<random.length;i++)random[i]=(i*2654435761>>>13)&255
  const zip=gzipSync(random)
  const kept=await capture({store,source,url,fetchImpl:async()=>new Response(zip),compression:'gzip'})
  assert.equal(kept.record.encoding,null); assert.equal(kept.record.storedBytes,zip.length); assert.deepEqual(await readdir(join(store,'objects')),[kept.record.sha256])
  await assert.rejects(capture({store,source,url:url+'?x=1',fetchImpl:async()=>new Response(compressible),compression:'brotli'}),/Unsupported compression/)
  const input=join(store,'input.json'); await writeFile(input,compressible)
  const imported=await importCapture({store,source,url:url+'?import=1',input,compression:'gzip'})
  assert.equal(imported.record.encoding,'gzip'); assert.equal(imported.record.acquisition,'local-import')
})
test('compaction compresses existing raw objects that save enough, leaves the rest, and reads still follow either form',async()=>{
  const store=await temporary()
  const a=await capture({store,source,url,fetchImpl:async()=>new Response(compressible)})
  const random=Buffer.alloc(4096); for(let i=0;i<random.length;i++)random[i]=(i*2246822519>>>11)&255
  const b=await capture({store,source,url:url+'?b',fetchImpl:async()=>new Response(gzipSync(random))})
  assert.equal(a.record.encoding,null)
  const result=await compactObjects(store)
  assert.equal(result.examined,2); assert.equal(result.compressed,1); assert.equal(result.kept,1); assert.ok(result.storedBytes<result.rawBytes)
  const names=(await readdir(join(store,'objects'))).sort(); assert.deepEqual(names,[`${a.record.sha256}.gz`,b.record.sha256].sort())
  assert.ok((await readCapture(store,source,url)).bytes.equals(compressible)); assert.equal((await readFile(join(store,'objects',b.record.sha256))).length,b.record.bytes)
  assert.deepEqual(await compactObjects(join(store,'absent')),{examined:0,compressed:0,kept:0,rawBytes:0,storedBytes:0})
})
