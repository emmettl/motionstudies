import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { unzipSync } from 'fflate'
import { z } from 'zod'
import { readOperationalFile } from '@motionstudies/data/release-files'

const safePath = (path) =>
  typeof path === 'string' &&
  path.length > 0 &&
  !isAbsolute(path) &&
  !path.includes('\\') &&
  path.split('/').every((part) => part && part !== '.' && part !== '..' && !/[\r\n]/.test(part))
const repositorySchema = z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)
const commitSchema = z.string().regex(/^[a-f0-9]{40}$/)
const releaseSchema = z.strictObject({
  schema: z.literal(1),
  source: z.strictObject({
    repository: repositorySchema,
    commit: commitSchema,
    runId: z.string().regex(/^\d+$/).nullable(),
  }),
  files: z
    .array(
      z.strictObject({
        path: z.string().refine(safePath),
        bytes: z.number().int().nonnegative(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      }),
    )
    .max(10000),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
})
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const rootOf = (options) => resolve(options.root ?? 'dist')
const directories = (options) => options.assetDirectories ?? ['assets']
const isAsset = (path, options) =>
  directories(options).some((directory) => path.startsWith(`${directory}/`))
const directives = (value) =>
  (value ?? '')
    .toLowerCase()
    .split(',')
    .map((part) => part.trim())
    .sort()
    .join(',')

async function inventory(root, prefix = '') {
  const files = []
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (!safePath(path) || entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile()))
      throw new Error(`Unsafe release entry: ${path}`)
    if (entry.isDirectory()) files.push(...(await inventory(root, path)))
    else if (path !== '_release.json') {
      const bytes = await readFile(join(root, path))
      files.push({ path, bytes: bytes.length, sha256: hash(bytes) })
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path, 'en'))
}

export function sourceCommit() {
  return commitSchema.parse(
    process.env.WORKERS_CI_COMMIT_SHA ??
      process.env.GITHUB_SHA ??
      execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  )
}

export async function stampStaticRelease(options) {
  const source = {
    repository: repositorySchema.parse(options.repository),
    commit: commitSchema.parse(options.commit),
    runId: options.runId == null ? null : String(options.runId),
  }
  const files = await inventory(rootOf(options))
  const release = releaseSchema.parse({
    schema: 1,
    source,
    files,
    sha256: hash(JSON.stringify(files)),
  })
  await writeFile(join(rootOf(options), '_release.json'), `${JSON.stringify(release, null, 2)}\n`)
  return release
}

export async function verifyStaticRelease(options) {
  const root = rootOf(options)
  const release = releaseSchema.parse(
    JSON.parse(
      (await readOperationalFile(join(root, '_release.json'), 2 * 1024 * 1024)).toString('utf8'),
    ),
  )
  if (
    release.source.repository !== options.repository ||
    release.source.commit !== options.commit ||
    (options.runId !== undefined && release.source.runId !== String(options.runId))
  )
    throw new Error('Release source does not match the checked repository, commit and run')
  const files = await inventory(root)
  if (
    JSON.stringify(files) !== JSON.stringify(release.files) ||
    hash(JSON.stringify(files)) !== release.sha256
  )
    throw new Error('Release contents differ from the checked artifact')
  return release
}

export async function writeStaticAssetHeaders(options = {}) {
  const root = rootOf(options)
  const paths = []
  async function visit(directory) {
    if (!safePath(directory)) throw new Error('Asset directories must stay inside the artifact')
    for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`
      if (entry.isDirectory()) await visit(path)
      else {
        if (
          !safePath(path) ||
          !entry.isFile() ||
          !/^[A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/i.test(entry.name)
        )
          throw new Error(`Immutable asset must have a Vite fingerprint: ${path}`)
        paths.push(path)
      }
    }
  }
  for (const directory of directories(options)) await visit(directory)
  const template = await readFile(join(root, '_headers'), 'utf8')
  if (/immutable/i.test(template)) throw new Error('Immutable headers must be generated per asset')
  if (template.split('\n').filter((line) => line.startsWith('/')).length + paths.length > 100)
    throw new Error('Asset headers exceed Cloudflare’s 100-rule limit')
  await writeFile(
    join(root, '_headers'),
    `${template.trimEnd()}\n\n${paths
      .sort()
      .map((path) => `/${path}\n  Cache-Control: public, max-age=31536000, immutable`)
      .join('\n\n')}\n`,
  )
  return { assets: paths.length }
}

function githubApi(options) {
  const repository = repositorySchema.parse(options.repository)
  const token = options.token ?? process.env.GITHUB_ARTIFACT_TOKEN
  if (!token)
    throw new Error('GITHUB_ARTIFACT_TOKEN must provide Actions read access to this repository')
  return async (path) => {
    const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) throw new Error(`GitHub artifact access failed: HTTP ${response.status}`)
    return response
  }
}

function matchingRun(run, options) {
  return (
    run.head_sha === options.commit &&
    run.head_branch === (options.branch ?? 'main') &&
    run.repository?.full_name === options.repository &&
    run.head_repository?.full_name === options.repository &&
    run.path === (options.workflow ?? '.github/workflows/check.yml') &&
    ['push', 'workflow_dispatch'].includes(run.event)
  )
}

function workflowPath(options) {
  const workflow = options.workflow ?? '.github/workflows/check.yml'
  if (!/^\.github\/workflows\/[A-Za-z0-9_-]+\.ya?ml$/.test(workflow))
    throw new Error('Expected a repository check workflow path')
  return `actions/workflows/${workflow.split('/').at(-1)}/runs`
}

export async function requireCurrentSource(options) {
  commitSchema.parse(options.commit)
  const query = new URLSearchParams({
    branch: options.branch ?? 'main',
    event: 'push',
    per_page: '1',
  })
  const listing = await (await githubApi(options)(`${workflowPath(options)}?${query}`)).json()
  if (!matchingRun(listing.workflow_runs?.[0] ?? {}, options))
    throw new Error('A newer main release superseded this build')
}

async function boundedArchive(response) {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Missing artifact archive')
  const chunks = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 50 * 1024 * 1024) throw new Error('Artifact archive exceeds 50 MiB')
      chunks.push(Buffer.from(value))
    }
  } finally {
    await reader.cancel()
  }
  return Buffer.concat(chunks)
}

async function extractArtifact(archive, directory) {
  let size = 0
  let invalid
  const files = unzipSync(new Uint8Array(archive), {
    filter(file) {
      const path = file.name.endsWith('/') ? file.name.slice(0, -1) : file.name
      size += file.originalSize
      if (!safePath(path)) invalid = new Error('Unsafe artifact path')
      if (size > 100 * 1024 * 1024) invalid = new Error('Expanded artifact exceeds 100 MiB')
      return !invalid
    },
  })
  if (invalid) throw invalid
  for (const [path, bytes] of Object.entries(files)) {
    if (path.endsWith('/')) continue
    await mkdir(dirname(join(directory, path)), { recursive: true })
    await writeFile(join(directory, path), bytes)
  }
}

export async function prepareCheckedArtifact(options) {
  commitSchema.parse(options.commit)
  const api = githubApi(options)
  const query = new URLSearchParams({
    branch: options.branch ?? 'main',
    head_sha: options.commit,
    per_page: '100',
  })
  let run
  for (let attempt = 0; attempt < 90; attempt++) {
    const listing = await (await api(`${workflowPath(options)}?${query}`)).json()
    run = listing.workflow_runs.filter((candidate) => matchingRun(candidate, options))[0]
    if (run?.status === 'completed') {
      if (run.conclusion !== 'success')
        throw new Error(`GitHub checks did not pass (${run.conclusion})`)
      break
    }
    console.log(`Waiting for GitHub checks on ${options.commit} (${attempt + 1}/90).`)
    await delay(5000)
  }
  if (run?.status !== 'completed' || !Number.isSafeInteger(run.id))
    throw new Error('Timed out waiting for matching GitHub checks')
  const listing = await (await api(`actions/runs/${run.id}/artifacts`)).json()
  const artifacts = listing.artifacts.filter(
    (artifact) => artifact.name === options.artifactName && !artifact.expired,
  )
  if (artifacts.length !== 1 || !Number.isSafeInteger(artifacts[0].id))
    throw new Error('Expected one unexpired checked site artifact')
  const artifact = artifacts[0]
  if (!/^sha256:[a-f0-9]{64}$/.test(artifact.digest ?? ''))
    throw new Error('GitHub artifact digest is unavailable')
  const archive = await boundedArchive(await api(`actions/artifacts/${artifact.id}/zip`))
  if (`sha256:${hash(archive)}` !== artifact.digest)
    throw new Error('Downloaded GitHub archive digest mismatch')
  const temporary = await mkdtemp(join(tmpdir(), 'study-checked-artifact-'))
  try {
    await extractArtifact(archive, temporary)
    await verifyStaticRelease({ ...options, root: temporary, runId: run.id })
    await requireCurrentSource(options)
    const output = rootOf(options)
    try {
      const existing = await lstat(output)
      if (!existing.isDirectory() || existing.isSymbolicLink())
        throw new Error('Artifact output must be an owned directory')
      const previous = releaseSchema.parse(
        JSON.parse(
          (await readOperationalFile(join(output, '_release.json'), 2 * 1024 * 1024)).toString(
            'utf8',
          ),
        ),
      )
      if (previous.source.repository !== options.repository)
        throw new Error('Artifact output belongs to another repository')
    } catch (error) {
      if (error.code !== 'ENOENT' || error.path !== output) throw error
    }
    await rm(output, { recursive: true, force: true })
    await cp(temporary, output, { recursive: true })
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
  const runUrl = `https://github.com/${options.repository}/actions/runs/${run.id}`
  console.log(`Using tested artifact ${artifact.id} from ${runUrl}; no rebuild performed.`)
  return { artifactId: artifact.id, runId: run.id, runUrl }
}

export async function verifyStaticDeployment(options) {
  z.boolean().parse(options.indexable)
  const release = await verifyStaticRelease(options)
  const base = new URL(options.siteUrl)
  if (
    base.protocol !== 'https:' ||
    base.username ||
    base.password ||
    base.pathname !== '/' ||
    base.search ||
    base.hash
  )
    throw new Error('Live verification requires an HTTPS origin')
  async function request(path, fresh = false) {
    const url = new URL(path, base)
    if (fresh) url.searchParams.set('verify', `${release.source.commit}-${Date.now()}`)
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`)
    const noindex = /noindex/i.test(response.headers.get('x-robots-tag') ?? '')
    if (noindex === options.indexable) throw new Error(`${path}: unexpected indexing policy`)
    return response
  }
  for (let attempt = 0; attempt < 18; attempt++) {
    try {
      const response = await request('/_release.json', true)
      const served = await response.json()
      if (
        served.source?.commit !== release.source.commit ||
        served.source?.runId !== release.source.runId ||
        served.sha256 !== release.sha256
      )
        throw new Error('Live release has not propagated yet')
      if (!/no-store/i.test(response.headers.get('cache-control') ?? ''))
        throw new Error('Release identity must not be cached')
      break
    } catch (error) {
      if (attempt === 17) throw error
      console.log(`Waiting for live release (${attempt + 1}/18): ${error.message}`)
      await delay(10000)
    }
  }
  for (const asset of release.files) {
    if (['_headers', '_redirects'].includes(asset.path)) continue
    const path = asset.path.endsWith('index.html')
      ? `/${asset.path.slice(0, -10)}`
      : `/${asset.path}`
    const response = await request(path)
    if (hash(Buffer.from(await response.arrayBuffer())) !== asset.sha256)
      throw new Error(`Live asset differs from the checked artifact: ${path}`)
    const cache = response.headers.get('cache-control') ?? ''
    if (isAsset(asset.path, options) && directives(cache) !== 'immutable,max-age=31536000,public')
      throw new Error(`Hashed asset lacks the one-year immutable cache policy: ${path}`)
    if (!isAsset(asset.path, options) && /immutable/i.test(cache))
      throw new Error(`Unversioned file must not have immutable caching: ${path}`)
    if (asset.path.endsWith('.html') && directives(cache) !== 'max-age=0,must-revalidate,public')
      throw new Error(`HTML must revalidate: ${path}`)
  }
  for (const path of [
    '/missing-file.js',
    '/missing-page/',
    ...directories(options).map((directory) => `/${directory}/missing-1234abcd.js`),
  ]) {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) })
    if (response.status !== 404) throw new Error(`${path} must return 404, got ${response.status}`)
    const cache = response.headers.get('cache-control') ?? ''
    if (
      /immutable/i.test(cache) ||
      [...cache.matchAll(/(?:s-maxage|max-age)=(\d+)/gi)].some((match) => Number(match[1]) > 0)
    )
      throw new Error(`Missing asset must not receive a positive cache lifetime: ${path}`)
  }
  console.log(
    `Verified live ${base.origin}: ${release.source.commit}, ${release.files.length} files.`,
  )
  return release
}
