import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { releaseRegistry, releasePackages, releaseTag } from './release-policy.mjs'

/** npm accepts publication before its registry finishes processing every artifact. */
export async function verifyPublishedPackages(release, {
  fetch: request = globalThis.fetch,
  attempts = 20,
  pause = () => delay(30_000),
  onPending = () => {},
} = {}) {
  if (release.tag !== releaseTag(release.version) || release.packages.length !== releasePackages.length ||
    release.packages.some((artifact, index) => artifact.name !== `@motionstudies/${releasePackages[index]}` ||
      artifact.version !== release.version || !artifact.integrity?.startsWith('sha512-'))) throw new Error('Invalid release manifest')
  let pending = [...release.packages]
  for (let attempt = 0; attempt < attempts; attempt++) {
    const unavailable = []
    for (const artifact of pending) {
      // A fresh query avoids retaining a pre-publication 404 at a registry edge.
      const url = `${releaseRegistry}${encodeURIComponent(artifact.name)}/${encodeURIComponent(artifact.version)}?verify=${Date.now()}-${attempt}`
      let response
      try { response = await request(url, { signal: AbortSignal.timeout(30_000) }) }
      catch { unavailable.push(artifact); continue }
      if (response.status === 404 || response.status === 429 || response.status >= 500) {
        unavailable.push(artifact); continue
      }
      if (!response.ok) throw new Error(`Registry verification failed (${response.status}): ${artifact.name}`)
      const published = await response.json()
      if (published.name !== artifact.name || published.version !== artifact.version || published.dist?.integrity !== artifact.integrity) {
        throw new Error(`Published artifact differs from the tested release: ${artifact.name}`)
      }
    }
    pending = unavailable
    if (!pending.length) return
    onPending(pending.map(artifact => artifact.name))
    if (attempt + 1 < attempts) await pause()
  }
  throw new Error(`Registry processing did not complete: ${pending.map(artifact => artifact.name).join(', ')}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const directory = resolve(process.env.RELEASE_ARTIFACTS ?? '.package-dist/tarballs')
  const release = JSON.parse(await readFile(resolve(directory, 'release.json'), 'utf8'))
  await verifyPublishedPackages(release, { onPending: names => console.log(`Waiting for npm processing: ${names.join(', ')}`) })
  console.log(`All ${release.packages.length} published ${release.version} artifacts match the tested release.`)
}
