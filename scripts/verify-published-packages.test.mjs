import { expect, test } from 'vitest'
import { verifyPublishedPackages } from './verify-published-packages.mjs'
const release = { version: '0.1.0-alpha.15', tag: 'next', packages: ['core','data','three','web'].map(name => ({ name: `@motionstudies/${name}`, version: '0.1.0-alpha.15', integrity: 'sha512-tested' })) }
const response = artifact => Response.json({ name: artifact.name, version: artifact.version, dist: { integrity: artifact.integrity } })

test('waits for delayed registry processing and retries only unavailable packages', async () => {
  const calls = [], pending = []; let pauses = 0
  await verifyPublishedPackages(release, {
    fetch: async url => {
      const artifact = release.packages.find(artifact => url.includes(encodeURIComponent(artifact.name)))
      calls.push(artifact.name)
      return artifact.name.endsWith('/three') && pauses === 0 ? new Response('', { status: 404 }) : response(artifact)
    }, pause: async () => { pauses++ }, onPending: names => pending.push(names),
  })
  expect(calls).toHaveLength(5)
  expect(pauses).toBe(1)
  expect(pending).toEqual([['@motionstudies/three']])
})
test('fails immediately on an immutable artifact mismatch', async () => {
  let pauses = 0
  await expect(verifyPublishedPackages(release, { fetch: async () => Response.json({ ...release.packages[0], dist: { integrity: 'sha512-different' } }), pause: async () => { pauses++ } })).rejects.toThrow('differs from the tested release')
  expect(pauses).toBe(0)
})
test('bounds retries for unavailable artifacts and transient network errors', async () => {
  let calls = 0, pauses = 0
  await expect(verifyPublishedPackages(release, { attempts: 2, fetch: async () => { calls++; throw new Error('network unavailable') }, pause: async () => { pauses++ } })).rejects.toThrow('processing did not complete')
  expect(calls).toBe(8); expect(pauses).toBe(1)
})
test('rejects unexpected registry responses and malformed release manifests', async () => {
  await expect(verifyPublishedPackages(release, { fetch: async () => new Response('', { status: 403 }) })).rejects.toThrow('verification failed (403)')
  await expect(verifyPublishedPackages({ ...release, packages: [] })).rejects.toThrow('Invalid release manifest')
})
