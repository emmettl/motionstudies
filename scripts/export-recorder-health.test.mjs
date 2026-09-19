import { it, expect } from 'vitest'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const exec = promisify(execFile)
it('submits a fresh unhealthy report and never replays it after a projection failure', async () => {
  const root = await mkdtemp(join(tmpdir(), 'feed-export-test-'))
  try {
    const status = join(root, 'producer.json'), credentials = join(root, 'credentials.json'), preload = join(root, 'fetch.mjs'), calls = join(root, 'calls')
    await writeFile(credentials, JSON.stringify({ pushToken: 'p'.repeat(32), accessClientId: 'test-access-id', accessClientSecret: 'test-access-secret' }))
    await writeFile(preload, `import { appendFile } from 'node:fs/promises';globalThis.fetch=async(url, options)=>{if(options.redirect!=='error'||options.headers['CF-Access-Client-Secret']!=='test-access-secret')throw new Error('bad request'); await appendFile(${JSON.stringify(calls)},options.body+'\\n');return new Response(null,{status:200})}`)
    const config = join(root, 'config.json'), stateRoot = join(root, 'state')
    await writeFile(config, JSON.stringify({ registry: resolve('config/feeds/recorder.production.json'), status, credentials, producer: 'recorder-minimax', stateRoot, url: 'https://observer.test/api/feeds/v1/producer' }))
    const options = { env: { ...process.env, NODE_OPTIONS: `--import=${preload}` } }
    // Missing status is valid unavailable telemetry and must reach the independent checker.
    const result = await exec(process.execPath, ['scripts/export-recorder-health.mjs', '--config', config], options)
    expect(result.stdout + result.stderr).toBe('')
    const sent = await readFile(calls, 'utf8')
    expect(JSON.parse(sent).telemetry.state).toBe('missing')
    expect(JSON.parse(await readFile(join(stateRoot, 'export-status.json'))).healthExitCode).toBe(2)
    await writeFile(status, '{malformed')
    await expect(exec(process.execPath, ['scripts/export-recorder-health.mjs', '--config', config], options)).rejects.toMatchObject({ code: 1 })
    expect(await readFile(calls, 'utf8')).toBe(sent)
    expect(JSON.parse(await readFile(join(stateRoot, 'export-status.json'))).state).toBe('failed')
  } finally { await rm(root, { recursive: true, force: true }) }
})
