import { expect, test } from 'vitest'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { writeRendererCaptures } from './renderer-capture-evidence.mjs'

// A small actual PNG, reused intentionally: parity is valid, provenance is distinct.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
const rows = () => ['legacy', 'webgl2', 'webgpu'].map(backend => ({
  key: `${backend}:independent-test`, project: 'desktop-chromium', status: 'passed',
  attachments: [
    { name: `${backend}-scene`, body: png.toString('base64') },
    { name: `${backend}-report`, body: Buffer.from(JSON.stringify({ backend, pass: true, generation: 5, frames: [{ visible: true, energy: 1 }] })).toString('base64') },
  ],
}))
test('writes independently paired attachments, hashes actual bytes and reports pixel equality without inventing a review', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'renderer-captures-'))
  try {
    const evidence = await writeRendererCaptures(rows(), join(directory, 'candidate-validation.json'), 'native-report-hash')
    expect(evidence.duplicateGroups).toEqual([['legacy', 'webgl2', 'webgpu']])
    expect(evidence.visualReview.status).toBe('pending')
    for (const capture of evidence.captures) {
      const written = await readFile(join(directory, capture.file))
      expect(written).toEqual(png)
      expect(capture.sha256).toBe(createHash('sha256').update(written).digest('hex'))
      expect(capture.source.case).toBe(`${capture.backend}:independent-test`)
    }
  } finally { await rm(directory, { recursive: true, force: true }) }
})
test('rejects a mislabelled backend or missing independent attachment', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'renderer-captures-'))
  try {
    const missing = rows(); missing[2].attachments.pop()
    await expect(writeRendererCaptures(missing, join(directory, 'test.json'), 'hash')).rejects.toThrow('Missing paired webgpu')
    const mismatch = rows(); mismatch[0].attachments[1].body = mismatch[1].attachments[1].body
    await expect(writeRendererCaptures(mismatch, join(directory, 'test.json'), 'hash')).rejects.toThrow('matching successful rendered-backend')
  } finally { await rm(directory, { recursive: true, force: true }) }
})
