// Shared checks for versioned release handoffs. Runs in Node and in browsers (Web Crypto only).

export const RELEASE_DIGEST = /^[a-f0-9]{64}$/
const SEGMENT = /^[A-Za-z0-9._-]{1,255}$/

/** A release-relative path: forward-slash segments of safe characters, never absolute, empty, `.` or `..`. */
export function isReleasePath(path) {
  return typeof path === 'string' && path.length <= 1024 && path.split('/').every(s => SEGMENT.test(s) && s !== '.' && s !== '..')
}

/** Validate one `{ path, sha256, bytes }` file descriptor; extra fields such as `decodedBytes` are kept. */
export function readDescriptor(value, label = 'file') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${label} descriptor`)
  if (!isReleasePath(value.path)) throw new Error(`Unsafe ${label} path`)
  if (!RELEASE_DIGEST.test(value.sha256 ?? '')) throw new Error(`Invalid ${label} digest`)
  if (!Number.isSafeInteger(value.bytes) || value.bytes < 0) throw new Error(`Invalid ${label} size`)
  return value
}

const looksLikeDescriptor = v => v && typeof v === 'object' && !Array.isArray(v) && typeof v.path === 'string' && 'sha256' in v && 'bytes' in v
/**
 * Every file a manifest describes, whatever its layout: a `files` array or name-keyed map, an `objects` map keyed by
 * digest, `chunks`, a published bus day's `list`, and named top-level descriptors such as `day` or `index`. The same
 * path may appear more than once (air releases list chunks in `files` and `chunks`) but must then describe the same
 * bytes.
 */
export function releaseDescriptors(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('Invalid release manifest')
  const found = new Map()
  const add = (value, label) => {
    const d = readDescriptor(value, label), seen = found.get(d.path)
    if (seen && (seen.sha256 !== d.sha256 || seen.bytes !== d.bytes)) throw new Error(`Conflicting descriptors for ${d.path}`)
    if (!seen) found.set(d.path, d)
  }
  for (const [key, value] of Object.entries(manifest)) {
    if (Array.isArray(value) && ['files', 'chunks', 'list'].includes(key)) value.forEach((v, i) => add(v, `${key}[${i}]`))
    else if (['files', 'objects'].includes(key) && value && typeof value === 'object' && !Array.isArray(value)) for (const [name, v] of Object.entries(value)) add(v, `${key}.${name}`)
    else if (looksLikeDescriptor(value)) add(value, key)
  }
  return [...found.values()].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)
}

/** Check a manifest's identity before trusting its layout. */
export function checkReleaseManifest(manifest, { kind, schemaVersions }) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('Invalid release manifest')
  if (kind !== undefined && manifest.kind !== kind) throw new Error(`Expected a ${kind} release`)
  if (schemaVersions !== undefined && !schemaVersions.includes(manifest.schemaVersion)) throw new Error(`Unsupported ${manifest.kind ?? 'release'} schema version`)
  return manifest
}

const hex = buffer => Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('')
/** SHA-256 of bytes as lowercase hex, through Web Crypto. */
export async function digestHex(bytes) {
  return hex(await globalThis.crypto.subtle.digest('SHA-256', bytes))
}
/** Throw unless `bytes` are exactly the descriptor's size and digest. */
export async function verifyDescriptorBytes(bytes, descriptor) {
  const d = readDescriptor(descriptor)
  if (bytes.byteLength !== d.bytes) throw new Error(`${d.path} has ${bytes.byteLength} bytes, expected ${d.bytes}`)
  if (await digestHex(bytes) !== d.sha256) throw new Error(`${d.path} does not match its digest`)
  return bytes
}
