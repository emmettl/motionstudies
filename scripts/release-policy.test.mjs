import { describe, expect, it } from 'vitest'
import { existingVersionAction, releasePackages, releaseRepository, releaseTag, validateReleaseManifests } from './release-policy.mjs'
function manifests() {
  return releasePackages.map((name) => ({ name: `@motionstudies/${name}`, version: '0.1.0-alpha.0', license: 'MIT', repository: { url: releaseRepository, directory: `packages/${name}` }, ...(name === 'core' ? {} : { dependencies: { '@motionstudies/core': '0.1.0-alpha.0' } }) }))
}
describe('release policy', () => {
  it('keeps prereleases off latest', () => {
    expect(releaseTag('0.1.0-alpha.0')).toBe('next')
    expect(releaseTag('1.0.0')).toBe('latest')
    expect(() => releaseTag('0.0.0')).toThrow()
    expect(() => releaseTag('01.2.3')).toThrow()
  })
  it('accepts a coordinated release', () => {
    expect(validateReleaseManifests(manifests())).toEqual({ version: '0.1.0-alpha.0', tag: 'next' })
  })
  it('rejects drift between package and dependency versions', () => {
    const packages = manifests()
    packages[1].dependencies['@motionstudies/core'] = '0.0.0'
    expect(() => validateReleaseManifests(packages)).toThrow('Shared dependency')
    packages[1].version = '0.2.0'
    expect(() => validateReleaseManifests(packages)).toThrow('versions must agree')
  })
  it('rejects missing licensing and incorrect provenance metadata', () => {
    const packages = manifests()
    delete packages[0].license
    expect(() => validateReleaseManifests(packages)).toThrow('Missing licence')
    packages[0].license = 'MIT'
    packages[0].repository.url = 'git+https://github.com/example/other.git'
    expect(() => validateReleaseManifests(packages)).toThrow('Incorrect source')
  })
  it('resumes only byte-identical previously published artifacts', () => {
    expect(existingVersionAction(null, 'sha512-test')).toBe('publish')
    expect(existingVersionAction({ dist: { integrity: 'sha512-test' } }, 'sha512-test')).toBe('skip')
    expect(() => existingVersionAction({ dist: { integrity: 'sha512-other' } }, 'sha512-test')).toThrow('different bytes')
  })
})
