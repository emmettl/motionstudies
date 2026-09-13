import {it as test,onTestFinished} from 'vitest'
import assert from 'node:assert/strict'
import {mkdtemp,rm,readdir,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {capture,importCapture,readCapture,publicSourceUrl,jsonDocument} from './source-store.mjs'
import {studyDay,utcDatesForDay,gtfsServiceInstant} from './uk-service-day.mjs'
const SOURCES={tide:{id:'fixture',publisher:'Synthetic source',kind:'test',documentation:'https://example.test',license:'Test only',origins:['https://environment.data.gov.uk']},ntis:{id:'not-configured',origins:[]}}
async function temporary() {
  const root = await mkdtemp(join(tmpdir(), 'underfall-feeds-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  return root
}

test('London observation windows preserve summer midnight and both DST day lengths', () => {
  assert.deepEqual(studyDay('2026-09-11'), { serviceDate: '2026-09-11', timezone: 'Europe/London', startUtc: '2026-09-10T23:00:00.000Z', endUtc: '2026-09-11T23:00:00.000Z', durationSeconds: 86400 })
  assert.equal(studyDay('2026-03-29').durationSeconds, 82800)
  assert.equal(studyDay('2026-10-25').durationSeconds, 90000)
  assert.deepEqual(utcDatesForDay(studyDay('2026-09-11')), ['2026-09-10', '2026-09-11'])
  assert.throws(() => studyDay('2026-02-30'), /actual service date/)
  assert.throws(() => studyDay(undefined), /actual service date/)
})

const publicUrl = 'https://environment.data.gov.uk/example.json'

test('capture retries transient errors, replays offline, and fails closed on corrupted bytes', async () => {
  const store = await temporary()
  let calls = 0
  const fetchImpl = async () => ++calls === 1 ? new Response('retry', { status: 503 }) : Response.json({ value: 0 })
  const first = await capture({ store, source: SOURCES.tide, url: publicUrl, fetchImpl, validate: jsonDocument })
  assert.equal(calls, 2)
  const replay = await capture({ store, source: SOURCES.tide, url: publicUrl, offline: true, fetchImpl: () => { throw new Error('No network allowed') } })
  assert.deepEqual(replay.record, first.record)
  assert.equal(replay.cached, true)
  await writeFile(join(store, 'objects', first.record.sha256), 'corrupted')
  await assert.rejects(readCapture(store, SOURCES.tide, publicUrl), /integrity/)
})

test('a rejected refresh preserves the previously usable capture and leaves no partial files', async () => {
  const store = await temporary()
  const options = { store, source: SOURCES.tide, url: publicUrl, validate: jsonDocument }
  const first = await capture({ ...options, fetchImpl: async () => Response.json({ old: true }) })
  await assert.rejects(capture({ ...options, refresh: true, fetchImpl: async () => new Response('<html>unavailable</html>') }))
  const still = await readCapture(store, SOURCES.tide, publicUrl, jsonDocument)
  assert.equal(still.record.sha256, first.record.sha256)
  assert.equal((await readdir(join(store, 'records'))).length, 1)
  assert.ok((await readdir(store, { recursive: true })).every(file => !file.endsWith('.partial')))
})

test('refresh retains capture history; offline miss never calls a provider', async () => {
  const store = await temporary()
  const base = { store, source: SOURCES.tide, url: publicUrl }
  await assert.rejects(capture({ ...base, offline: true, fetchImpl: () => { throw new Error('network') } }), /No cached capture/)
  const first = await capture({ ...base, fetchImpl: async () => new Response('one') })
  const second = await capture({ ...base, refresh: true, fetchImpl: async () => new Response('two') })
  assert.notEqual(first.record.sha256, second.record.sha256)
  assert.equal((await readdir(join(store, 'records'))).length, 2)
})

test('a local import records import time without inventing provider retrieval time', async () => {
  const store = await temporary()
  const input = join(store, 'saved.json')
  await writeFile(input, '{"value":0}')
  const result = await importCapture({ store, source: SOURCES.tide, url: publicUrl, input })
  assert.equal(result.record.retrievedAt, null)
  assert.ok(Number.isFinite(Date.parse(result.record.importedAt)))
  assert.equal(result.record.acquisition, 'local-import')
})

test('byte limits and permanent errors do not retry or cache invalid responses', async () => {
  const store = await temporary()
  let calls = 0
  await assert.rejects(capture({ store, source: SOURCES.tide, url: publicUrl, maxBytes: 3, fetchImpl: async () => { calls++; return new Response('too large') } }), /byte limit/)
  assert.equal(calls, 1)
  await assert.rejects(capture({ store, source: SOURCES.tide, url: publicUrl, fetchImpl: async () => { calls++; return new Response('denied', { status: 401 }) } }), /HTTP 401/)
  assert.equal(calls, 2)
  assert.deepEqual(await readdir(store), [])
})

test('public capture cannot archive secret-bearing URLs or an unconfigured origin', () => {
  for (const url of ['https://user:password@environment.data.gov.uk/a', 'https://environment.data.gov.uk/a?api_key=secret', 'https://environment.data.gov.uk/a?X-Amz-Signature=secret']) assert.throws(() => publicSourceUrl(SOURCES.tide, url), /credentials/)
  assert.throws(() => publicSourceUrl(SOURCES.ntis, 'https://trafficengland.info/'), /not configured/)
})

test('GTFS noon origin differs from civil midnight at DST and preserves next-day service times',()=>{
 assert.equal(gtfsServiceInstant('2026-03-29',0),'2026-03-28T23:00:00.000Z')
 assert.equal(gtfsServiceInstant('2026-10-25',0),'2026-10-25T00:00:00.000Z')
 assert.equal(gtfsServiceInstant('2026-09-12',90000),'2026-09-13T00:00:00.000Z')
 assert.throws(()=>gtfsServiceInstant('2026-09-12',-.5))
})
test('invalid capture limits fail before network access; HTTP 204 is not an empty measurement',async()=>{
 const store=await temporary();let calls=0
 const options={store,source:SOURCES.tide,url:publicUrl,fetchImpl:async()=>{calls++;return new Response(null,{status:204})}}
 await assert.rejects(capture({...options,retries:-1}),/limits/)
 await assert.rejects(capture({...options,maxBytes:0}),/limits/)
 assert.equal(calls,0)
 await assert.rejects(capture(options),/HTTP 204/)
 assert.equal(calls,1);assert.deepEqual(await readdir(store),[])
})
