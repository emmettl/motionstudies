// Offline power compatibility checks in disposable consumers. Provider capture is never invoked.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { buildPackages, packageNames } from './build-packages.mjs'

const { values } = parseArgs({ options: Object.fromEntries(['england', 'recorder', 'registry', 'manifest'].map(key => [key, { type: 'string' }])) })
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)
const output = await mkdtemp(join(tmpdir(), 'motion-power-consumers-')), cache = join(output, 'npm-cache')
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
function run(command, args, cwd = root, capture = false) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed${capture ? `: ${result.stderr}` : ''}`)
  return result.stdout
}
console.log(`Power consumer evidence: ${output}`)
const dependencies = {}, artifacts = [], consumers = []
if (values.registry) {
  // Require an exact version, never a moving dist-tag or range.
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(values.registry)) throw new Error('--registry requires an exact version')
  for (const name of packageNames) dependencies[`@motionstudies/${name}`] = values.registry
} else {
  await buildPackages()
  for (const name of packageNames) {
    const [packed] = JSON.parse(run('npm', ['pack', join(root, '.package-dist', name), '--json', '--pack-destination', output, '--cache', cache], root, true))
    const path = join(output, packed.filename)
    dependencies[`@motionstudies/${name}`] = `file:${path}`
    artifacts.push({ name, file: packed.filename, sha256: digest(await readFile(path)) })
  }
}
let england
for (const name of ['england', 'recorder']) {
  const source = resolve(values[name] ?? join(root, '..', name === 'recorder' ? 'motionstudies-recorder' : name)), target = join(output, name)
  await mkdir(target)
  // Copy code/config only. Retained public evidence is a read-only input to the checks;
  // no private work store, credentials, Git metadata or source node_modules are copied.
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory() && ['src', 'scripts'].includes(entry.name)) await cp(join(source, entry.name), join(target, entry.name), { recursive: true })
    else if (entry.isDirectory() && entry.name === 'public' && name === 'england') await symlink(join(source, entry.name), join(target, entry.name), 'dir')
    else if (entry.isFile() && /^(\.gitignore|\.oxlintrc\.json|package\.json|.*\.html|tsconfig.*\.json|vite.*\.[cm]?[jt]s)$/.test(entry.name)) await cp(join(source, entry.name), join(target, entry.name))
  }
  const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  for (const section of ['dependencies', 'devDependencies']) for (const key of Object.keys(manifest[section] ?? {})) {
    if (key in dependencies) manifest[section][key] = dependencies[key]
  }
  await writeFile(join(target, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', cache], target)
  if (name === 'england') { run('npm', ['run', 'check'], target); england = target }
  else run(process.execPath, ['--test', 'scripts/feeds/power.test.mjs', 'scripts/feeds/power-release.test.mjs'], target)
  const lock = JSON.parse(await readFile(join(target, 'package-lock.json'), 'utf8'))
  consumers.push({ name, checks: name === 'england' ? ['test', 'lint', 'build'] : ['power writer', 'power release'], packages: Object.fromEntries(Object.keys(dependencies).filter(key => lock.packages[`node_modules/${key}`]).map(key => {
    const installed = lock.packages[`node_modules/${key}`]
    if (values.registry) assert.equal(installed.version, values.registry)
    return [key, { version: installed.version, resolved: installed.resolved, integrity: installed.integrity }]
  })) })
}
let replay = null
if (values.manifest) {
  // Optional explicit handoff, not a dependency on a recorder work-directory layout.
  const rebuilt = join(output, 'recompiled-power')
  run(process.execPath, ['scripts/compile-power.mjs', '--manifest', resolve(values.manifest), '--out', rebuilt, '--curated', 'scripts/power/curated.csv'], england)
  const bytes = await readFile(join(rebuilt, 'day.json')), day = JSON.parse(bytes)
  const baseline = join(england, 'public', 'data', 'power', day.date)
  for (const path of ['day.json', ...day.units.map(unit => unit.evidence.path)]) assert.ok((await readFile(join(rebuilt, path))).equals(await readFile(join(baseline, path))), `Offline replay differs: ${path}`)
  replay = { date: day.date, units: day.units.length, comparedFiles: day.units.length + 1, daySha256: digest(bytes), inputManifestSha256: digest(await readFile(resolve(values.manifest))) }
}
await writeFile(join(output, 'report.json'), JSON.stringify({ passed: true, mode: values.registry ? 'registry' : 'packed', artifacts, consumers, replay }, null, 2) + '\n')
console.log(`Power consumers passed: ${output}/report.json`)
