import { afterEach, describe, expect, it, vi } from 'vitest'
import worker, { editions } from './edition-router.mjs'
afterEach(() => vi.unstubAllGlobals())
describe('public edition routing', () => {
  it.each(editions)('serves %s data and preserves query strings and binary content', async (edition) => {
    const bytes = new Uint8Array([0, 127, 255])
    const upstream = vi.fn().mockResolvedValue(new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream' } }))
    vi.stubGlobal('fetch', upstream)
    const response = await worker.fetch(new Request(`https://motionstudies.app/${edition}/data/chunk.bin?v=2`))
    expect(upstream.mock.calls[0][0].href).toBe(`https://emmettl.github.io/${edition}/data/chunk.bin?v=2`)
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes)
    expect(response.headers.get('content-type')).toBe('application/octet-stream')
  })
  it('redirects HTTP edition requests to HTTPS', async () => {
    const response = await worker.fetch(new Request('http://motionstudies.app/allchange/data/file.json?v=2'))
    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://motionstudies.app/allchange/data/file.json?v=2')
  })
  it('adds the trailing slash without losing query strings', async () => {
    const response = await worker.fetch(new Request('https://motionstudies.app/umlauf?view=water'))
    expect(response.status).toBe(308)
    expect(response.headers.get('location')).toBe('https://motionstudies.app/umlauf/?view=water')
  })
  it('does not forward cookies or authorization to the edition host', async () => {
    const upstream = vi.fn().mockResolvedValue(new Response(null, { status: 304 }))
    vi.stubGlobal('fetch', upstream)
    const response = await worker.fetch(new Request('https://motionstudies.app/allchange/', {
      method: 'HEAD', headers: { Cookie: 'private=1', Authorization: 'Bearer private', 'If-None-Match': 'abc' },
    }))
    const options = upstream.mock.calls[0][1]
    expect(options.method).toBe('HEAD')
    expect(options.headers.get('cookie')).toBeNull()
    expect(options.headers.get('authorization')).toBeNull()
    expect(options.headers.get('if-none-match')).toBe('abc')
    expect(response.status).toBe(304)
  })
  it.each(['/gleislicht/', '/local-express/', '/gleislicht-other/', '/lab/'])('leaves %s at the catalogue origin', async (path) => {
    const upstream = vi.fn().mockResolvedValue(new Response('origin', { status: 404 }))
    vi.stubGlobal('fetch', upstream)
    const request = new Request(`https://motionstudies.app${path}`)
    expect((await worker.fetch(request)).status).toBe(404)
    expect(upstream).toHaveBeenCalledWith(request)
  })
  it('keeps edition redirects on the custom domain', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.redirect('https://emmettl.github.io/allchange/data/', 301)))
    const response = await worker.fetch(new Request('https://motionstudies.app/allchange/data'))
    expect(response.headers.get('location')).toBe('https://motionstudies.app/allchange/data/')
  })
  it('rejects writes before contacting the origin', async () => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    expect((await worker.fetch(new Request('https://motionstudies.app/manifest/', { method: 'POST' }))).status).toBe(405)
    expect(upstream).not.toHaveBeenCalled()
  })
  it('returns a useful failure when the edition origin is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect((await worker.fetch(new Request('https://motionstudies.app/norikae/'))).status).toBe(502)
  })
})
