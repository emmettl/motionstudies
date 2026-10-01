import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker from './pfad-subdomain.mjs'

test('subdomain maps root, data and assets to the same artifact, preserving request headers', async () => {
  for (const path of ['/?country=ie', '/assets/index-abcdefgh.js', '/data/pfad/ch-20260929-abcdef123456/nodes.bin']) {
    const response = new Response(new Uint8Array([0, 127, 255]), { headers: { 'Cache-Control': 'immutable' } })
    const request = new Request('https://pfad.motionstudies.app' + path, { headers: { Range: 'bytes=0-2' } })
    const result = await worker.fetch(request, { ASSETS: { fetch: async (asset) => {
      assert.equal(asset.url, 'https://pfad.motionstudies.app/pfad' + path)
      assert.equal(asset.headers.get('range'), 'bytes=0-2')
      return response
    } } })
    assert.equal(result, response)
    assert.deepEqual(new Uint8Array(await result.arrayBuffer()), new Uint8Array([0, 127, 255]))
  }
})

test('existing path route passes through unchanged', async () => {
  const request = new Request('https://motionstudies.app/pfad/?from=zurich')
  await worker.fetch(request, { ASSETS: { fetch: async (asset) => {
    assert.equal(asset, request)
    return new Response('pfad')
  } } })
})

test('asset redirects stay at the root of the subdomain with their query', async () => {
  const result = await worker.fetch(new Request('https://pfad.motionstudies.app/index.html?country=is'), {
    ASSETS: { fetch: async () => Response.redirect('https://pfad.motionstudies.app/pfad/?country=is', 308) },
  })
  assert.equal(result.status, 308)
  assert.equal(result.headers.get('location'), 'https://pfad.motionstudies.app/?country=is')
})

test('HEAD stays HEAD; missing assets stay 404', async () => {
  const result = await worker.fetch(new Request('https://pfad.motionstudies.app/missing.bin', { method: 'HEAD' }), {
    ASSETS: { fetch: async (asset) => {
      assert.equal(asset.method, 'HEAD')
      return new Response(null, { status: 404 })
    } },
  })
  assert.equal(result.status, 404)
})

test('rejects writes and redirects HTTP before fetching assets', async () => {
  const env = { ASSETS: { fetch: () => assert.fail('unexpected asset fetch') } }
  assert.equal((await worker.fetch(new Request('https://pfad.motionstudies.app/', { method: 'POST' }), env)).status, 405)
  const result = await worker.fetch(new Request('http://pfad.motionstudies.app/?country=ie'), env)
  assert.equal(result.headers.get('location'), 'https://pfad.motionstudies.app/?country=ie')
})
