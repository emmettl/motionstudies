import { expect, it } from 'vitest'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { runNetworkChunkCli } from './network-chunk-cli.mjs'

it('writes an opening and verified day chunks with the edition CLI arguments', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'network-cli-'))
  try {
    const input = join(directory, 'input.json'), manifestPath = join(directory, 'day-manifest.json'), opening = join(directory, 'opening.json')
    await writeFile(input, JSON.stringify({ metadata: { windowStart: 0, windowEnd: 7200, focusTime: 3600 }, bounds: {}, stops: [], edges: [], trains: [{ id: 'crossing', start: 3500, end: 3700 }] }))
    await runNetworkChunkCli(['--input', input, '--manifest', manifestPath, '--opening', opening, '--chunk-hours', '1', '--opening-start', '00:00', '--opening-end', '01:00', '--focus', '00:30'])
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    expect(manifest.chunks).toHaveLength(2)
    for (const chunk of manifest.chunks) {
      const bytes = await readFile(join(directory, chunk.path))
      expect(bytes.length).toBe(chunk.bytes)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(chunk.sha256)
      expect(JSON.parse(bytes).trains[0].id).toBe('crossing')
    }
    expect(JSON.parse(await readFile(opening, 'utf8')).metadata.focusTime).toBe(1800)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
it('rejects missing paths without writing files', async () => {
  await expect(runNetworkChunkCli([])).rejects.toThrow('Usage:')
})
