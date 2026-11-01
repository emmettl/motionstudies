import { createHash } from 'node:crypto'
import { it, expect, onTestFinished } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkEditionBoundary } from './edition-boundary.mjs'
import { moduleReferences } from './module-references.mjs'

async function fixture(extra = false) {
  const root = await mkdtemp(join(tmpdir(), 'edition-boundary-'))
  onTestFinished(() => rm(root, { recursive: true, force: true }))
  const dependencies = {}, packages = {}
  async function write(path, value) {
    await mkdir(join(root, path, '..'), { recursive: true })
    await writeFile(join(root, path), typeof value === 'string' ? value : JSON.stringify(value))
  }
  const names = ['core', 'data', 'three', 'web'].map(name => `@motionstudies/${name}`)
  if (extra) names.push('@example/audio')
  for (const name of names) {
    dependencies[name] = '0.1.0-alpha.1'
    packages[`node_modules/${name}`] = { version: dependencies[name], resolved: `https://registry.npmjs.org/${name}/artifact.tgz`, integrity: 'sha512-fixture' }
    await write(`node_modules/${name}/package.json`, { version: dependencies[name], ...(name.startsWith('@motionstudies/') ? { private: false } : {}), exports: { './public': './public.js' } })
  }
  await write('package.json', { dependencies })
  await write('package-lock.json', { packages })
  await write('src/app.ts', "export { value } from '@motionstudies/core/public'")
  await write('scripts/build.mjs', "import { readFile } from 'node:fs/promises'")
  return { root, write, dependencies, packages }
}

it('parses imports, type queries, re-exports and require while ignoring comments', () => {
  expect(moduleReferences(`// import 'comment-only'
    import type { T } from 'types'; export * from 'exports'; import 'effects';
    const p = import('lazy'); type X = import('type-query').X; const r = require('commonjs')`, 'app.ts'))
    .toEqual(['types', 'exports', 'effects', 'lazy', 'type-query', 'commonjs'])
  expect(moduleReferences('const value = import(variable)', 'app.ts')).toEqual([undefined])
  expect(moduleReferences('@import "./local.css"; @import url("https://example.test/font.css");', 'app.css')).toEqual(['./local.css', 'https://example.test/font.css'])
})

it('checks an explicit root and extra registry packages independently of cwd', async () => {
  const f = await fixture(true)
  await f.write('src/app.ts', "import '@example/audio/public'")
  await expect(checkEditionBoundary({ root: f.root, additionalPackages: ['@example/audio'] })).resolves.toBeUndefined()
  await f.write('src/app.ts', "import '@example/audio/private'")
  await expect(checkEditionBoundary({ root: f.root, additionalPackages: ['@example/audio'] })).rejects.toThrow('Private package import')
})

it.each([
  ["import 'undeclared-package'", 'Undeclared dependency'],
  ["export * from '@motionstudies/core/private'", 'Private package import'],
  ["import '../../sibling/source.ts'", 'imports outside'],
  ['const loaded = import(sourceName)', 'Unverifiable module reference'],
])('rejects forbidden source references: %s', async (source, error) => {
  const f = await fixture()
  await f.write('src/app.ts', source)
  await expect(checkEditionBoundary({ root: f.root })).rejects.toThrow(error)
})

it.each(['range', 'missing', 'registry', 'integrity', 'linked', 'installed'])('rejects %s package drift', async kind => {
  const f = await fixture(), name = '@motionstudies/core'
  if (kind === 'range') f.dependencies[name] = '^0.1.0'
  if (kind === 'missing') delete f.dependencies[name]
  if (kind === 'registry') f.packages[`node_modules/${name}`].resolved = 'file:../candidate'
  if (kind === 'integrity') delete f.packages[`node_modules/${name}`].integrity
  if (kind === 'linked') f.packages[`node_modules/${name}`].link = true
  if (kind === 'installed') await f.write(`node_modules/${name}/package.json`, { version: '0.0.0', private: false })
  await f.write('package.json', { dependencies: f.dependencies })
  await f.write('package-lock.json', { packages: f.packages })
  await expect(checkEditionBoundary({ root: f.root })).rejects.toThrow(/Expected an exact|Registry lock mismatch|Installed release mismatch/)
})

it('rejects installed source links despite valid manifest and lock entries', async () => {
  const f = await fixture()
  await rm(join(f.root, 'node_modules/@motionstudies/core'), { recursive: true })
  await mkdir(join(f.root, 'candidate'))
  await symlink(join(f.root, 'candidate'), join(f.root, 'node_modules/@motionstudies/core'))
  await expect(checkEditionBoundary({ root: f.root })).rejects.toThrow('Shared source link')
})

it('requires configured worker directories and checks their imports', async () => {
  const f = await fixture(), directories = ['src', 'scripts', 'edge-worker']
  await expect(checkEditionBoundary({ root: f.root, directories })).rejects.toThrow()
  await f.write('edge-worker/entry.ts', "import 'unlisted-worker-dependency'")
  await expect(checkEditionBoundary({ root: f.root, directories })).rejects.toThrow('Undeclared dependency')
})

it('rejects workspaces and vendored shared directories', async () => {
  const f = await fixture()
  await f.write('package.json', { dependencies: f.dependencies, workspaces: ['packages/*'] })
  await expect(checkEditionBoundary({ root: f.root })).rejects.toThrow('not workspaces')
  await f.write('package.json', { dependencies: f.dependencies })
  await f.write('packages/copied.ts', '')
  await expect(checkEditionBoundary({ root: f.root })).rejects.toThrow('Shared package source belongs')
})

it.each(['types.d.ts', 'types.d.mts', 'types.d.cts'])('parses ambient declarations in %s', file => {
  expect(moduleReferences("export const value: import('@motionstudies/core/public').Value", file))
    .toEqual(['@motionstudies/core/public'])
})

const digest = source => createHash('sha256').update(source).digest('hex')
it('permits one exact audited generator while retaining static import checks', async () => {
  const f = await fixture(), source = "import '@motionstudies/core/public'; const value = import(generatedUrl)"
  await f.write('scripts/generated.mjs', source)
  const entry = { file: 'scripts/generated.mjs', sourceSha256: digest(source), dynamicReferences: 1 }
  await expect(checkEditionBoundary({ root: f.root, verifiedGeneratedReferences: [entry] })).resolves.toBeUndefined()
  const privateSource = source.replace('/public', '/private')
  await f.write(entry.file, privateSource)
  await expect(checkEditionBoundary({ root: f.root, verifiedGeneratedReferences: [{ ...entry, sourceSha256: digest(privateSource) }] })).rejects.toThrow('Private package import')
})
it('rejects generator source changes and computed-reference count drift', async () => {
  const f = await fixture(), source = 'const value = import(generatedUrl)'
  await f.write('scripts/generated.mjs', source)
  const entry = { file: 'scripts/generated.mjs', sourceSha256: digest(source), dynamicReferences: 1 }
  await expect(checkEditionBoundary({ root: f.root, verifiedGeneratedReferences: [{ ...entry, dynamicReferences: 2 }] })).rejects.toThrow('count mismatch')
  await f.write(entry.file, source + '; const other = import(otherUrl)')
  await expect(checkEditionBoundary({ root: f.root, verifiedGeneratedReferences: [entry] })).rejects.toThrow('source hash mismatch')
})
it('does not permit another file or silently accept an unused generator entry', async () => {
  const f = await fixture(), source = 'const value = import(generatedUrl)', entry = { file: 'scripts/generated.mjs', sourceSha256: digest(source), dynamicReferences: 1 }
  await expect(checkEditionBoundary({ root: f.root, verifiedGeneratedReferences: [entry] })).rejects.toThrow('Unused generated-reference')
  await f.write(entry.file, source); await f.write('src/other.ts', source)
  await expect(checkEditionBoundary({ root: f.root, verifiedGeneratedReferences: [entry] })).rejects.toThrow('Unverifiable module reference')
})
it.each([
  { file: '../outside.mjs', sourceSha256: '0'.repeat(64), dynamicReferences: 1 },
  { file: 'scripts/generated.mjs', sourceSha256: 'not-a-digest', dynamicReferences: 1 },
  { file: 'scripts/generated.mjs', sourceSha256: '0'.repeat(64), dynamicReferences: 0 },
])('rejects invalid generated-reference entries: %s', async entry => {
  const f = await fixture()
  await expect(checkEditionBoundary({ root: f.root, verifiedGeneratedReferences: [entry] })).rejects.toThrow(/Invalid|outside-root/)
})

it('rejects duplicate audited-generator entries', async () => {
  const f = await fixture(), entry = { file: 'scripts/generated.mjs', sourceSha256: digest('const value = import(url)'), dynamicReferences: 1 }
  await expect(checkEditionBoundary({ root: f.root, verifiedGeneratedReferences: [entry,entry] })).rejects.toThrow('Duplicate')
})

it('rejects malformed source instead of accepting a recovered partial AST', () => {
  expect(() => moduleReferences("import 'allowed'; const =", 'broken.ts')).toThrow(/Cannot parse broken.ts/)
})

it('parses JSX and declaration imports while treating computed references as unverifiable', () => {
  expect(moduleReferences(`const node = <p>🚂</p>; export { x } from 'named'; const p = import(` + "`computed`" + `); require(variable)`, 'view.tsx'))
    .toEqual(['named', undefined, undefined])
  expect(moduleReferences(`declare const value: import('declaration').Value`, 'types.d.mts')).toEqual(['declaration'])
})

it('recognizes parenthesized static references', () => {
  expect(moduleReferences("const value = import(('lazy')); require(('commonjs'))", 'app.js')).toEqual(['lazy', 'commonjs'])
})
