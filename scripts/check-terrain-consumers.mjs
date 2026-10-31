// Verify consumer migrations against real compiled tarballs, without changing editions.
import { cp, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { buildPackages, packageNames } from './build-packages.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)
const argument = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i < 0 ? fallback : process.argv[i + 1] }
const output = await mkdtemp(join(tmpdir(), 'motion-terrain-consumers-'))
const cache = join(output, 'npm-cache')
console.log(`Terrain consumer evidence: ${output}`)
function run(command, args, cwd = root, capture = false) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed${capture ? `: ${result.stderr}` : ''}`)
  return result.stdout
}
await buildPackages()
const dependencies = {}, artifacts = []
for (const name of packageNames) {
  const [packed] = JSON.parse(run('npm', ['pack', join(root, '.package-dist', name), '--json', '--pack-destination', output, '--cache', cache], root, true))
  const path = join(output, packed.filename)
  dependencies[`@motionstudies/${name}`] = `file:${path}`
  artifacts.push({ name, file: packed.filename, sha256: createHash('sha256').update(await readFile(path)).digest('hex') })
}
for (const name of ['gleislicht', 'schwall']) {
  const source = resolve(argument(name, join(root, '..', name))), target = join(output, name)
  await mkdir(target)
  // Keep measured assets read-only and avoid copying credentials, Git state or installed dependencies.
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (['src', 'scripts', 'e2e', 'realtime-worker', 'astra-worker'].includes(entry.name) && entry.isDirectory()) {
      await cp(join(source, entry.name), join(target, entry.name), { recursive: true })
    } else if (entry.isFile() && /^(package\.json|index\.html|verify\.html|tsconfig.*\.json|vite.*\.[cm]?ts|vitest.*\.[cm]?ts|playwright.*\.ts)$/.test(entry.name)) {
      await cp(join(source, entry.name), join(target, entry.name))
    } else if (['public', 'data'].includes(entry.name) && entry.isDirectory()) {
      await symlink(join(source, entry.name), join(target, entry.name), 'dir')
    }
  }
  const patch = join(root, 'scripts/terrain-migrations', `${name}.patch`)
  const pending = spawnSync('git', ['apply', '--check', patch], { cwd: target })
  if (pending.status === 0) run('git', ['apply', patch], target)
  else {
    // A migrated edition is also a valid consumer; reject partial or conflicting edits.
    run('git', ['apply', '--reverse', '--check', patch], target)
    console.log(`${name}: terrain migration is already applied`)
  }
  const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  manifest.dependencies = { ...manifest.dependencies, ...dependencies }
  if (manifest.devDependencies) delete manifest.devDependencies['@motionstudies/data']
  await writeFile(join(target, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', cache], target)
  if (name === 'gleislicht') {
    run('npx', ['vitest', 'run', 'scripts/ingest-rigi-terrain.test.mjs', 'scripts/jungfrau-terrain.test.ts', 'scripts/gornergrat-terrain.test.ts', 'scripts/pilatus-terrain.test.ts', 'scripts/rochers-terrain.test.ts', 'scripts/territet-terrain.test.ts', 'scripts/glion-terrain.test.ts', 'src/test/terrain-state.dom.test.tsx'], target)
  } else run('npm', ['test'], target)
  run('npm', ['run', 'typecheck'], target)
  run('npm', ['run', 'build'], target)
}
if (process.argv.includes('--browser')) {
  const { chromium } = await import(pathToFileURL(join(output, 'gleislicht/node_modules/playwright/index.mjs')).href)
  const { preview } = await import(pathToFileURL(join(output, 'schwall/node_modules/vite/dist/node/index.js')).href)
  process.chdir(join(output, 'schwall'))
  const server = await preview({ preview: { port: Number(argument('port', '4197')), host: '127.0.0.1', strictPort: true } })
  let browser
  try {
    browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] })
    const page = await browser.newPage({ viewport: { width: 960, height: 600 } }), errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /shader|WebGLProgram/i.test(message.text())) errors.push(message.text()) })
    await page.goto(`${server.resolvedUrls.local[0]}?paused`)
    await page.waitForFunction(() => window.__schwall)
    await page.evaluate(() => window.__schwall.advance(.5))
    await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
    const time = await page.evaluate(() => window.__schwall.time())
    if (time < .5 || errors.length) throw new Error(JSON.stringify({ time, errors }))
    await page.screenshot({ path: join(output, 'schwall.png') })
  } finally { await browser?.close(); await server.close(); process.chdir(root) }
}
await writeFile(join(output, 'report.json'), `${JSON.stringify({ artifacts, passed: true, browser: process.argv.includes('--browser') }, null, 2)}\n`)
console.log(`Terrain migrations passed; artifacts and consumers retained at ${output}`)
