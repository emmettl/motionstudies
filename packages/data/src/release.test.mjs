import { describe, it, expect, afterEach } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { isReleasePath, releaseDescriptors, checkReleaseManifest, verifyDescriptorBytes, digestHex } from './release.mjs'
import { openRelease, readReleaseFile, verifyRelease } from './release-files.mjs'

const sha = b => createHash('sha256').update(b).digest('hex')
const describe_ = (path, bytes) => ({ path, sha256: sha(bytes), bytes: bytes.length })
const dirs = []
afterEach(async () => { await Promise.all(dirs.splice(0).map(d => rm(d, { recursive: true, force: true }))) })
async function release(files, manifestOf) {
  const root = await mkdtemp(join(tmpdir(), 'release-')); dirs.push(root)
  for (const [path, bytes] of Object.entries(files)) { await mkdir(join(root, path, '..'), { recursive: true }); await writeFile(join(root, path), bytes) }
  const manifest = manifestOf(Object.fromEntries(Object.entries(files).map(([p, b]) => [p, describe_(p, b)])))
  await writeFile(join(root, 'manifest.json'), JSON.stringify(manifest))
  return { root, manifest }
}

describe('release descriptors', () => {
  it('accepts only safe release-relative paths', () => {
    for (const ok of ['day.json', 'objects/' + 'a'.repeat(64), 'chunk-001.json.gz.bin']) expect(isReleasePath(ok)).toBe(true)
    for (const bad of ['', '/etc/passwd', '../x', 'a/../b', 'a//b', './a', 'a\\b', 'a b', 5]) expect(isReleasePath(bad)).toBe(false)
  })

  it('enumerates the layouts the recorder writes today', () => {
    const d = (p, n = 1) => ({ path: p, sha256: String(n).repeat(64).slice(0, 64), bytes: n })
    const h = 'a'.repeat(64)
    // Power: named descriptors plus an objects map keyed by digest.
    expect(releaseDescriptors({ kind: 'power-evidence-release', day: d('day.json'), units: d('units.json', 2), objects: { [h]: d(`objects/${h}`, 3) }, sources: [{ sha256: h }] }).map(x => x.path)).toEqual(['day.json', `objects/${h}`, 'units.json'])
    // Air: a files array, repeated in chunks and named descriptors.
    const chunk = { ...d('chunk-000.json.gz.bin', 4), start: 0, end: 600 }
    expect(releaseDescriptors({ files: [d('chunk-000.json.gz.bin', 4), d('index.json.gz.bin', 5)], chunks: [chunk], index: d('index.json.gz.bin', 5) }).map(x => x.path)).toEqual(['chunk-000.json.gz.bin', 'index.json.gz.bin'])
    // Road: a files map keyed by name. Feed quality: a one-file array.
    expect(releaseDescriptors({ files: { report: d('report.json'), series: d('series.json', 2) } })).toHaveLength(2)
    expect(releaseDescriptors({ schemaVersion: 1, resultId: h, files: [d('result.json')] })).toHaveLength(1)
    // Bus day: `files` is a count and `list` carries the descriptors (with digests since the recorder added them).
    expect(releaseDescriptors({ date: '2026-09-18', files: 3, list: [d('index.json'), d('slices/00-00.json', 2)] }).map(x => x.path)).toEqual(['index.json', 'slices/00-00.json'])
    expect(() => releaseDescriptors({ files: 2, list: [{ path: 'index.json', bytes: 1 }] })).toThrow(/digest/)
  })

  it('refuses conflicting or unsafe descriptors', () => {
    const d = { path: 'a.json', sha256: 'a'.repeat(64), bytes: 1 }
    expect(() => releaseDescriptors({ files: [d], index: { ...d, bytes: 2 } })).toThrow(/Conflicting/)
    expect(() => releaseDescriptors({ files: [{ ...d, path: '../a.json' }] })).toThrow(/Unsafe/)
    expect(() => releaseDescriptors({ files: [{ ...d, sha256: 'x' }] })).toThrow(/digest/)
    expect(() => checkReleaseManifest({ kind: 'air-day-release', schemaVersion: 2 }, { kind: 'air-day-release', schemaVersions: [1] })).toThrow(/schema/)
    expect(() => checkReleaseManifest({ kind: 'other' }, { kind: 'air-day-release' })).toThrow(/Expected/)
  })

  it('verifies bytes with Web Crypto', async () => {
    const bytes = new TextEncoder().encode('hello')
    expect(await digestHex(bytes)).toBe(sha(bytes))
    await expect(verifyDescriptorBytes(bytes, describe_('a', Buffer.from('hello')))).resolves.toBe(bytes)
    await expect(verifyDescriptorBytes(bytes, describe_('a', Buffer.from('hellO')))).rejects.toThrow(/digest/)
    await expect(verifyDescriptorBytes(bytes, describe_('a', Buffer.from('hello!')))).rejects.toThrow(/bytes/)
  })
})

describe('release directories', () => {
  it('opens, reads and verifies a release, pinned to its manifest digest', async () => {
    const { root } = await release({ 'day.json': '{"a":1}', 'objects/o': 'raw' }, f => ({ kind: 'power-evidence-release', schemaVersion: 1, day: f['day.json'], objects: { o: f['objects/o'] } }))
    const pinned = sha(Buffer.from(JSON.stringify({ kind: 'power-evidence-release', schemaVersion: 1, day: describe_('day.json', Buffer.from('{"a":1}')), objects: { o: describe_('objects/o', Buffer.from('raw')) } })))
    const opened = await openRelease(root, { kind: 'power-evidence-release', schemaVersions: [1], manifestSha256: pinned })
    expect((await opened.read('day.json')).toString()).toBe('{"a":1}')
    await expect(opened.read('other.json')).rejects.toThrow(/not described/)
    await expect(openRelease(root, { manifestSha256: 'b'.repeat(64) })).rejects.toThrow(/pinned/)
    expect(await verifyRelease(root, { kind: 'power-evidence-release', schemaVersions: [1] })).toMatchObject({ files: 2, bytes: 10, manifestSha256: pinned })
  })

  it('detects changed files and refuses links that leave the release', async () => {
    const { root, manifest } = await release({ 'day.json': 'good' }, f => ({ files: [f['day.json']] }))
    await writeFile(join(root, 'day.json'), 'evil')
    await expect(verifyRelease(root)).rejects.toThrow(/digest/)
    const outside = await mkdtemp(join(tmpdir(), 'outside-')); dirs.push(outside)
    await writeFile(join(outside, 'secret'), 'good'); await rm(join(root, 'day.json')); await symlink(join(outside, 'secret'), join(root, 'day.json'))
    await expect(readReleaseFile(root, manifest.files[0])).rejects.toThrow(/outside/)
    // A link to another file inside the release is refused too: a path names exactly the file written there.
    await writeFile(join(root, 'other.json'), 'good'); await rm(join(root, 'day.json')); await symlink(join(root, 'other.json'), join(root, 'day.json'))
    await expect(readReleaseFile(root, manifest.files[0])).rejects.toThrow(/symbolic link/)
    await rm(join(root, 'day.json')); await mkdir(join(root, 'real')); await writeFile(join(root, 'real', 'day.json'), 'good'); await symlink(join(root, 'real'), join(root, 'dir'))
    await expect(readReleaseFile(root, { ...manifest.files[0], path: 'dir/day.json' })).rejects.toThrow(/symbolic link/)
    await expect(verifyRelease(root, { maxTotalBytes: 1 })).rejects.toThrow(/budget/)
  })
})
