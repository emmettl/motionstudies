import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile, rename, rm, stat, readdir, unlink } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { gzipSync, gunzipSync } from 'node:zlib'

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function publicSourceUrl(source, value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.hash ||
      [...url.searchParams.keys()].some(key => /key|token|password|secret|signature|credential/i.test(key))) {
    throw new Error('Source URLs must be public HTTPS URLs without credentials or fragments')
  }
  if (!source.origins.includes(url.origin)) throw new Error(`URL origin is not configured for ${source.id}`)
  return url.href
}

export async function atomicJson(path, value) {
  await atomicWrite(path, Buffer.from(`${JSON.stringify(value, null, 2)}\n`))
}

async function atomicWrite(path, bytes) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  const temporary = `${path}.${randomUUID()}.partial`
  try {
    await writeFile(temporary, bytes, { mode: 0o600 })
    await rename(temporary, path)
  } finally {
    await rm(temporary, { force: true })
  }
}

function requestKey(source, url) { return sha256(`${source.id}\n${url}`) }

export async function readCapture(store, source, url, validate = () => {}) {
  const record = JSON.parse(await readFile(join(store, 'requests', `${requestKey(source, url)}.json`), 'utf8'))
  if (record.source.id !== source.id || record.url !== url || !/^[a-f0-9]{64}$/.test(record.sha256)) throw new Error('Capture identity mismatch')
  const bytes = await readObject(store, record.sha256, record.bytes)
  if (bytes.length !== record.bytes || sha256(bytes) !== record.sha256) throw new Error('Capture integrity check failed')
  await validate(bytes)
  return { bytes, record, cached: true }
}
/** Read an object by its raw-content hash, whether it is stored raw or gzip-compressed at rest. */
export async function readObject(store, hash, expectedBytes) {
  try { return await readFile(join(store, 'objects', hash)) } catch (error) { if (error.code !== 'ENOENT') throw error }
  const compressed = await readFile(join(store, 'objects', `${hash}.gz`))
  try { return gunzipSync(compressed, { maxOutputLength: (expectedBytes ?? 512 * 1024 * 1024) + 1 }) } catch { throw new Error('Compressed capture could not be expanded within its recorded size') }
}
/** Store object bytes, compressing at rest when asked and worthwhile; the hash of the raw bytes remains the identity. */
async function writeObject(store, hash, bytes, compression) {
  if (compression === 'gzip') {
    const compressed = gzipSync(bytes, { level: 6 })
    if (compressed.length <= bytes.length * 0.9) { await atomicWrite(join(store, 'objects', `${hash}.gz`), compressed); return { storedBytes: compressed.length, encoding: 'gzip' } }
  } else if (compression !== undefined) throw new Error('Unsupported compression; use gzip or leave unset')
  await atomicWrite(join(store, 'objects', hash), bytes)
  return { storedBytes: bytes.length, encoding: null }
}
/** Compress existing raw objects in a store where gzip saves at least the given fraction. Records keep their raw hash and byte count; reads follow either form. */
export async function compactObjects(store, { minimumSaving = 0.1 } = {}) {
  const result = { examined: 0, compressed: 0, kept: 0, rawBytes: 0, storedBytes: 0 }
  let names
  try { names = await readdir(join(store, 'objects')) } catch (error) { if (error.code === 'ENOENT') return result; throw error }
  for (const name of names.filter(n => /^[a-f0-9]{64}$/.test(n))) {
    const bytes = await readFile(join(store, 'objects', name))
    result.examined++; result.rawBytes += bytes.length
    const compressed = gzipSync(bytes, { level: 6 })
    if (compressed.length <= bytes.length * (1 - minimumSaving)) {
      await atomicWrite(join(store, 'objects', `${name}.gz`), compressed)
      if (sha256(gunzipSync(compressed)) !== name) throw new Error('Compressed object failed verification; raw object retained')
      await unlink(join(store, 'objects', name)); result.compressed++; result.storedBytes += compressed.length
    } else { result.kept++; result.storedBytes += bytes.length }
  }
  return result
}

async function persist(store, source, url, bytes, acquisition, response = {}, compression) {
  const hash = sha256(bytes)
  const stored = await writeObject(store, hash, bytes, compression)
  const record = {
    schemaVersion: 1, source: { id: source.id, publisher: source.publisher, kind: source.kind, documentation: source.documentation, license: source.license, ...(source.attribution ? { attribution: source.attribution } : {}) },
    url, sha256: hash, bytes: bytes.length, storedBytes: stored.storedBytes, encoding: stored.encoding,
    ...(acquisition === 'http' ? { retrievedAt: new Date().toISOString() } : { retrievedAt: null, importedAt: new Date().toISOString() }),
    acquisition, validation: 'raw-capture; see adapter audit for fitness', ...response,
  }
  await atomicJson(join(store, 'records', `${randomUUID()}.json`), record)
  await atomicJson(join(store, 'requests', `${requestKey(source, url)}.json`), record)
  return { bytes, record, cached: false }
}

export async function importCapture({ store, source, url, input, maxBytes = 512 * 1024 * 1024, validate = () => {}, compression }) {
  url = publicSourceUrl(source, url)
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Expected a positive byte limit')
  if ((await stat(input)).size > maxBytes) throw new Error('Source file exceeds byte limit')
  const bytes = await readFile(input)
  if (!bytes.length || bytes.length > maxBytes) throw new Error('Source file is empty or exceeds byte limit')
  await validate(bytes)
  return persist(store, source, url, bytes, 'local-import', {}, compression)
}

export async function capture({ store, source, url, offline = false, refresh = false, maxBytes = 32 * 1024 * 1024, timeoutMs = 20000, retries = 2, validate = () => {}, fetchImpl = fetch, userAgent = 'Motion Studies source capture', compression }) {
  url = publicSourceUrl(source, url)
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || !Number.isSafeInteger(retries) || retries < 0 || retries > 10) throw new Error('Invalid capture limits')
  if (offline && refresh) throw new Error('Offline and refresh cannot be combined')
  if (!refresh) {
    try { return await readCapture(store, source, url, validate) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  if (offline) throw new Error(`No cached capture for ${source.id}; offline mode never downloads`)
  for (let attempt = 0; attempt <= retries; attempt++) {
    let retryable = true
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), headers: { 'User-Agent': userAgent } })
      if (response.status === 204) {
        retryable = false
        throw new Error('Source returned HTTP 204: no report content; this does not mean zero traffic')
      }
      if (!response.ok) {
        retryable = response.status === 429 || response.status >= 500
        await response.body?.cancel()
        throw new Error(`Source returned HTTP ${response.status}`)
      }
      if (Number(response.headers.get('content-length')) > maxBytes) {
        retryable = false
        await response.body?.cancel()
        throw new Error('Source exceeds byte limit')
      }
      if (!response.body) throw new Error('Source response has no body')
      const reader = response.body.getReader()
      const chunks = []
      let size = 0
      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          size += value.length
          if (size > maxBytes) { retryable = false; await reader.cancel(); throw new Error('Source exceeds byte limit') }
          chunks.push(value)
        }
      } finally { reader.releaseLock() }
      const bytes = Buffer.concat(chunks)
      retryable = false
      if (!bytes.length) throw new Error('Source response is empty')
      await validate(bytes)
      return await persist(store, source, url, bytes, 'http', {
        httpStatus: response.status, contentType: response.headers.get('content-type'),
        lastModified: response.headers.get('last-modified'), etag: response.headers.get('etag'),
      }, compression)
    } catch (error) {
      if (!retryable || attempt === retries) throw error
      await delay(250 * 2 ** attempt)
    }
  }
}

export function jsonDocument(bytes) {
  const value = JSON.parse(bytes.toString('utf8'))
  if (!value || typeof value !== 'object') throw new Error('Expected a JSON document')
  return value
}
