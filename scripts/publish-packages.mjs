import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { existingVersionAction, releasePackages, releaseRegistry, releaseTag, validateReleaseManifests } from './release-policy.mjs'

const directory = resolve(process.env.RELEASE_ARTIFACTS ?? '.package-dist/tarballs')
const release = JSON.parse(await readFile(resolve(directory, 'release.json'), 'utf8'))
const publish = process.argv.includes('--publish')
if (release.tag !== releaseTag(release.version)) throw new Error('Release version/tag mismatch')
if (release.packages.length !== releasePackages.length) throw new Error('Missing release artifacts')
if (process.env.RELEASE_VERSION && process.env.RELEASE_VERSION !== release.version) throw new Error('Requested version differs from the tested release')
if (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== release.sourceCommit) throw new Error('Artifacts were built from a different commit')
if (publish) {
  if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_REPOSITORY !== 'emmettl/motionstudies' || process.env.GITHUB_REF !== 'refs/heads/main' || process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch') throw new Error('Publish only from the manual main-branch release workflow')
  if (!['bootstrap', 'trusted'].includes(process.env.RELEASE_AUTH)) throw new Error('Choose bootstrap or trusted authentication')
  if (process.env.RELEASE_AUTH === 'bootstrap' && !process.env.NODE_AUTH_TOKEN) throw new Error('NPM_TOKEN is missing')
  if (process.env.RELEASE_AUTH === 'trusted' && process.env.NODE_AUTH_TOKEN) throw new Error('Trusted publishing must run without a token fallback')
}

const manifests = []
for (const [index, artifact] of release.packages.entries()) {
  if (artifact.name !== `@motionstudies/${releasePackages[index]}` || artifact.version !== release.version || basename(artifact.file) !== artifact.file) throw new Error('Unexpected release artifact')
  const file = resolve(directory, artifact.file)
  const integrity = `sha512-${createHash('sha512').update(await readFile(file)).digest('base64')}`
  if (integrity !== artifact.integrity) throw new Error(`Artifact integrity mismatch: ${artifact.name}`)
  const extracted = spawnSync('tar', ['-xOf', file, 'package/package.json'], { encoding: 'utf8' })
  if (extracted.status !== 0) throw new Error(`Cannot read package metadata: ${artifact.name}`)
  const manifest = JSON.parse(extracted.stdout)
  if (manifest.private !== false || manifest.name !== artifact.name || manifest.version !== artifact.version) throw new Error(`Not a publishable artifact: ${artifact.name}`)
  if (manifest.publishConfig?.registry !== releaseRegistry || manifest.publishConfig?.access !== 'public' || manifest.publishConfig?.tag !== release.tag) throw new Error('Unexpected publication configuration')
  manifests.push(manifest)
}
validateReleaseManifests(manifests)

// Preflight all packages before publishing the first. A rerun can resume a partial release.
const plan = []
for (const artifact of release.packages) {
  let action = 'dry-run'
  if (publish) {
    const response = await fetch(`${releaseRegistry}${encodeURIComponent(artifact.name)}/${encodeURIComponent(release.version)}`, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok && response.status !== 404) throw new Error(`Registry check failed (${response.status}): ${artifact.name}`)
    action = existingVersionAction(response.status === 404 ? null : await response.json(), artifact.integrity)
  }
  plan.push({ ...artifact, action })
}
for (const artifact of plan) {
  console.log(`${artifact.action}: ${artifact.name}@${release.version} (${release.tag})`)
  if (artifact.action === 'skip') continue
  const args = ['publish', resolve(directory, artifact.file), '--access', 'public', '--tag', release.tag, '--registry', releaseRegistry, '--ignore-scripts', publish ? '--provenance' : '--provenance=false']
  if (!publish) args.push('--dry-run')
  const result = spawnSync('npm', args, { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Publish failed for ${artifact.name}; rerun this same version to resume`)
}
