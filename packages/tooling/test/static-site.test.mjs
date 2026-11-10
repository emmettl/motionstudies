import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { zipSync } from 'fflate'
import {
  prepareCheckedArtifact,
  requireCurrentSource,
  stampStaticRelease,
  verifyStaticDeployment,
  verifyStaticRelease,
  writeStaticAssetHeaders,
} from '../src/static-site.mjs'

const commit = 'a'.repeat(40)
async function fixture(run) {
  const temporary = await mkdtemp(join(tmpdir(), 'tooling-static-'))
  const root = join(temporary, 'source')
  await mkdir(join(root, 'assets'), { recursive: true })
  const options = {
    root,
    repository: 'example/edition',
    commit,
    runId: '42',
    artifactName: 'checked-site',
    token: 'test-only-placeholder',
  }
  try {
    await writeFile(join(root, 'index.html'), '<title>Edition</title>')
    await writeFile(join(root, 'assets/main-abcd1234.js'), 'export const edition = 1')
    await writeFile(
      join(root, '_headers'),
      '/*\n  X-Content-Type-Options: nosniff\n\n/_release.json\n  Cache-Control: no-store\n',
    )
    await run(options, temporary)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

function checkedRun(options, extra = {}) {
  return {
    id: 42,
    head_sha: commit,
    head_branch: 'main',
    repository: { full_name: options.repository },
    head_repository: { full_name: options.repository },
    path: '.github/workflows/check.yml',
    event: 'push',
    status: 'completed',
    conclusion: 'success',
    ...extra,
  }
}

test('a release binds repository, commit, run, exact files and regular-file ownership', () =>
  fixture(async (options) => {
    await stampStaticRelease(options)
    await verifyStaticRelease(options)
    await assert.rejects(verifyStaticRelease({ ...options, repository: 'example/other' }), /source/)
    await assert.rejects(verifyStaticRelease({ ...options, commit: 'b'.repeat(40) }), /source/)
    await assert.rejects(verifyStaticRelease({ ...options, runId: 43 }), /source/)
    await writeFile(join(options.root, 'assets/extra-abcd1234.js'), 'extra')
    await assert.rejects(verifyStaticRelease(options), /contents/)
    await rm(join(options.root, 'assets/extra-abcd1234.js'))
    await symlink('../index.html', join(options.root, 'assets/link-abcd1234.js'))
    await assert.rejects(stampStaticRelease(options), /Unsafe release/)
  }))

test('immutable caching covers emitted fingerprints without caching unknown paths', () =>
  fixture(async (options) => {
    assert.deepEqual(await writeStaticAssetHeaders(options), { assets: 1 })
    const headers = await readFile(join(options.root, '_headers'), 'utf8')
    assert.match(
      headers,
      /\/assets\/main-abcd1234\.js\n  Cache-Control: public, max-age=31536000, immutable/,
    )
    assert.ok(!headers.includes('/assets/*'))
    await writeFile(join(options.root, 'assets/unversioned.js'), '')
    await assert.rejects(writeStaticAssetHeaders(options), /fingerprint/)
  }))

test('headers reject symlinks, path escapes and Cloudflare rule overflow', () =>
  fixture(async (options) => {
    await assert.rejects(
      writeStaticAssetHeaders({ ...options, assetDirectories: ['../source'] }),
      /inside/,
    )
    await symlink('../index.html', join(options.root, 'assets/link-abcd1234.js'))
    await assert.rejects(writeStaticAssetHeaders(options), /fingerprint/)
    await rm(join(options.root, 'assets/link-abcd1234.js'))
    for (let i = 0; i < 99; i++)
      await writeFile(join(options.root, `assets/chunk${i}-abcd1234.js`), '')
    await assert.rejects(writeStaticAssetHeaders(options), /100-rule/)
  }))

test('artifact download admits only the checked source and replaces an owned output', () =>
  fixture(async (options, temporary) => {
    await writeStaticAssetHeaders(options)
    const release = await stampStaticRelease(options)
    const entries = Object.fromEntries(
      await Promise.all(
        [...release.files.map((file) => file.path), '_release.json'].map(async (path) => [
          path,
          new Uint8Array(await readFile(join(options.root, path))),
        ]),
      ),
    )
    let archive = zipSync(entries)
    const artifact = {
      id: 7,
      name: options.artifactName,
      expired: false,
      digest: `sha256:${createHash('sha256').update(archive).digest('hex')}`,
    }
    const fetchMock = async (input) => {
      const url = new URL(input)
      if (url.pathname.endsWith('/artifacts/7/zip')) return new Response(archive)
      if (url.pathname.endsWith('/runs/42/artifacts'))
        return Response.json({ artifacts: [artifact] })
      return Response.json({ workflow_runs: [checkedRun(options)] })
    }
    const original = globalThis.fetch
    globalThis.fetch = fetchMock
    try {
      const output = join(temporary, 'downloaded')
      assert.deepEqual(await prepareCheckedArtifact({ ...options, root: output }), {
        artifactId: 7,
        runId: 42,
        runUrl: 'https://github.com/example/edition/actions/runs/42',
      })
      await verifyStaticRelease({ ...options, root: output })
      await mkdir(join(temporary, 'unowned'))
      await assert.rejects(
        prepareCheckedArtifact({ ...options, root: join(temporary, 'unowned') }),
        /ENOENT/,
      )
      assert.ok(await readFile(join(output, 'index.html')))
      artifact.digest = `sha256:${'0'.repeat(64)}`
      await assert.rejects(prepareCheckedArtifact({ ...options, root: output }), /digest mismatch/)
      archive = zipSync({ '../outside.txt': new TextEncoder().encode('escape') })
      artifact.digest = `sha256:${createHash('sha256').update(archive).digest('hex')}`
      await assert.rejects(prepareCheckedArtifact({ ...options, root: output }), /Unsafe artifact/)
      await verifyStaticRelease({ ...options, root: output })
    } finally {
      globalThis.fetch = original
    }
  }))

test('foreign workflow, repository, event, branch and superseded heads cannot pass the source gate', () =>
  fixture(async (options) => {
    const original = globalThis.fetch
    try {
      for (const extra of [
        { head_sha: 'b'.repeat(40) },
        { head_branch: 'branch' },
        { repository: { full_name: 'other/repo' } },
        { head_repository: { full_name: 'other/repo' } },
        { path: '.github/workflows/other.yml' },
        { event: 'pull_request' },
      ]) {
        globalThis.fetch = async () =>
          Response.json({ workflow_runs: [checkedRun(options, extra)] })
        await assert.rejects(requireCurrentSource(options), /superseded/)
      }
      globalThis.fetch = async () =>
        Response.json({ workflow_runs: [checkedRun(options, { conclusion: 'failure' })] })
      await assert.rejects(prepareCheckedArtifact(options), /did not pass/)
    } finally {
      globalThis.fetch = original
    }
  }))

test('live checks enforce exact bytes, indexing, immutable assets and non-cacheable 404s', () =>
  fixture(async (options) => {
    await writeStaticAssetHeaders(options)
    await stampStaticRelease(options)
    const original = globalThis.fetch
    let missingCache = ''
    let mutate = false
    globalThis.fetch = async (input) => {
      const path = new URL(input).pathname
      const file = path === '/' ? 'index.html' : path.slice(1)
      let bytes
      try {
        bytes = await readFile(join(options.root, file))
      } catch {
        return new Response(null, { status: 404, headers: { 'Cache-Control': missingCache } })
      }
      if (mutate && file.endsWith('.js')) bytes = Buffer.from('tampered')
      return new Response(bytes, {
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control':
            file === '_release.json'
              ? 'no-store'
              : file.startsWith('assets/')
                ? 'public, max-age=31536000, immutable'
                : 'public, max-age=0, must-revalidate',
        },
      })
    }
    try {
      const live = { ...options, siteUrl: 'https://edition.example', indexable: false }
      await verifyStaticDeployment(live)
      missingCache = 'public, max-age=31536000, immutable'
      await assert.rejects(verifyStaticDeployment(live), /Missing asset/)
      missingCache = ''
      mutate = true
      await assert.rejects(verifyStaticDeployment(live), /differs/)
    } finally {
      globalThis.fetch = original
    }
  }))
