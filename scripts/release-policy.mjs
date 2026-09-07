export const releaseRepository = 'git+https://github.com/emmettl/motionstudies.git'
export const releaseRegistry = 'https://registry.npmjs.org/'
export const releasePackages = ['core', 'data', 'three', 'web']

export function releaseTag(version) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:alpha|beta|rc)\.(0|[1-9]\d*))?$/.test(version) || version === '0.0.0') {
    throw new Error(`Choose a release version, optionally with alpha.N, beta.N or rc.N: ${version}`)
  }
  return version.includes('-') ? 'next' : 'latest'
}

export function validateReleaseManifests(manifests) {
  const version = manifests[0]?.version
  const tag = releaseTag(version)
  if (manifests.length !== releasePackages.length) throw new Error('A release needs all four packages')
  for (const [index, manifest] of manifests.entries()) {
    const name = releasePackages[index]
    if (manifest.name !== `@motionstudies/${name}` || manifest.version !== version) throw new Error('Release package names and versions must agree')
    if (!manifest.license) throw new Error(`Missing licence: ${manifest.name}`)
    if (manifest.repository?.url !== releaseRepository || manifest.repository?.directory !== `packages/${name}`) throw new Error(`Incorrect source repository: ${manifest.name}`)
    for (const [dependency, range] of Object.entries(manifest.dependencies ?? {})) {
      if (dependency.startsWith('@motionstudies/') && range !== version) throw new Error(`Shared dependency must pin ${version}: ${manifest.name}`)
      if (/^(?:file:|workspace:|link:)/.test(range)) throw new Error(`Local dependency cannot be published: ${dependency}`)
    }
  }
  return { version, tag }
}

export function existingVersionAction(existing, integrity) {
  if (existing === null) return 'publish'
  if (existing.dist?.integrity !== integrity) throw new Error('This version already exists with different bytes; bump the version')
  return 'skip'
}
