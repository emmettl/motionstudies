import { realpath } from 'node:fs/promises'
import { join, relative, isAbsolute, resolve, sep } from 'node:path'
import { readOperationalFile } from './operational-files.mjs'
import { checkReleaseManifest, digestHex, isReleasePath, readDescriptor, releaseDescriptors, verifyDescriptorBytes } from './release.mjs'

export { readOperationalFile }
const inside = (root, path) => { const r = relative(root, path); return r !== '' && !r.startsWith(`..${sep}`) && r !== '..' && !isAbsolute(r) }

/** Read one described file from a release directory: safe path, no escape through links, bounded, size and digest checked. */
export async function readReleaseFile(root, descriptor, { maxBytes = 512 * 1024 ** 2 } = {}) {
  const d = readDescriptor(descriptor)
  if (d.bytes > maxBytes) throw new Error(`${d.path} exceeds the read limit`)
  const base = await realpath(resolve(root)), actual = await realpath(join(base, ...d.path.split('/')))
  if (!inside(base, actual)) throw new Error(`${d.path} resolves outside the release`)
  return verifyDescriptorBytes(await readOperationalFile(actual, d.bytes), d)
}

/**
 * Open a release directory: read `manifest.json` (bounded), optionally require its pinned digest, check its kind and
 * schema, and enumerate its files. Nothing but the manifest is read until asked.
 */
export async function openRelease(root, { kind, schemaVersions, manifestSha256, maxManifestBytes = 8 * 1024 ** 2, manifest: name = 'manifest.json' } = {}) {
  if (!isReleasePath(name)) throw new Error('Unsafe manifest path')
  const bytes = await readOperationalFile(join(resolve(root), name), maxManifestBytes)
  if (manifestSha256 !== undefined && await digestHex(bytes) !== manifestSha256) throw new Error('Release manifest does not match its pinned digest')
  const manifest = checkReleaseManifest(JSON.parse(bytes.toString('utf8')), { kind, schemaVersions })
  const descriptors = releaseDescriptors(manifest), byPath = new Map(descriptors.map(d => [d.path, d]))
  return {
    manifest, manifestBytes: bytes, descriptors,
    /** Read a described file by path or descriptor; a path the manifest does not list is refused. */
    read: async (file, options) => {
      const d = typeof file === 'string' ? byPath.get(file) : file
      const listed = d && byPath.get(d.path)
      if (!listed || listed.sha256 !== d.sha256 || listed.bytes !== d.bytes) throw new Error(`${typeof file === 'string' ? file : file?.path} is not described by the manifest`)
      return readReleaseFile(root, d, options)
    },
  }
}

/** Verify every file a release describes against a total byte budget. */
export async function verifyRelease(root, { maxTotalBytes = 2 * 1024 ** 3, ...options } = {}) {
  const release = await openRelease(root, options)
  const total = release.descriptors.reduce((n, d) => n + d.bytes, 0)
  if (total > maxTotalBytes) throw new Error('Release exceeds the verification budget')
  for (const d of release.descriptors) await readReleaseFile(root, d)
  return { manifest: release.manifest, manifestSha256: await digestHex(release.manifestBytes), files: release.descriptors.length, bytes: total }
}
