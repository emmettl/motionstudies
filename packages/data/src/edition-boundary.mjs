import { createHash } from 'node:crypto'
import { access, lstat, readFile, readdir, realpath } from 'node:fs/promises'
import { builtinModules } from 'node:module'
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { moduleReferences } from './module-references.mjs'

export async function checkEditionBoundary({ root = '.', directories = ['src', 'scripts'], additionalPackages = [], verifiedGeneratedReferences = [] } = {}) {
  root = resolve(root)
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'))
  const declared = { ...manifest.dependencies, ...manifest.devDependencies }
  if (manifest.workspaces) throw new Error('An edition must consume installed packages, not workspaces')
  try { await access(resolve(root, 'packages')); throw new Error('Shared package source belongs in Motion Studies') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  const generated = new Map(), usedGenerated = new Set()
  for (const entry of verifiedGeneratedReferences) {
    if (!entry || typeof entry.file !== 'string' || !entry.file || isAbsolute(entry.file) || !/^[a-f0-9]{64}$/.test(entry.sourceSha256) || !Number.isInteger(entry.dynamicReferences) || entry.dynamicReferences < 1) throw new Error('Invalid verified generated-reference entry')
    const file = resolve(root, entry.file), path = relative(root, file)
    if (path === '..' || path.startsWith(`..${sep}`) || generated.has(file)) throw new Error('Duplicate or outside-root generated-reference entry')
    generated.set(file, entry)
  }
  const exported = new Map()
  for (const name of [...['core', 'data', 'three', 'web'].map(name => `@motionstudies/${name}`), ...additionalPackages]) {
    const version = declared[name]
    if (!/^\d+\.\d+\.\d+(?:-(?:alpha|beta|rc)\.\d+)?$/.test(version ?? '')) throw new Error(`Expected an exact registry version: ${name}`)
    const locked = lock.packages[`node_modules/${name}`]
    if (locked?.version !== version || !locked.resolved?.startsWith('https://registry.npmjs.org/') || !locked.integrity?.startsWith('sha512-') || locked.link) throw new Error(`Registry lock mismatch: ${name}`)
    const installed = resolve(root, 'node_modules', name)
    if ((await lstat(installed)).isSymbolicLink() || !(await realpath(installed)).startsWith(`${await realpath(resolve(root, 'node_modules'))}${sep}`)) throw new Error(`Shared source link: ${name}`)
    const pkg = JSON.parse(await readFile(`${installed}/package.json`, 'utf8'))
    if (pkg.version !== version || pkg.private === true || (name.startsWith('@motionstudies/') && pkg.private !== false)) throw new Error(`Installed release mismatch: ${name}`)
    exported.set(name, pkg.exports)
  }

  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name)
      if (entry.isDirectory()) { await visit(file); continue }
      if (!/\.(?:[cm]?[jt]sx?|css)$/.test(file)) continue
      const source = await readFile(file, 'utf8'), references = moduleReferences(source, file), allowance = generated.get(file)
      if (allowance) {
        if (createHash('sha256').update(source).digest('hex') !== allowance.sourceSha256) throw new Error(`Generated-reference source hash mismatch: ${file}`)
        if (references.filter(reference => reference === undefined).length !== allowance.dynamicReferences) throw new Error(`Generated-reference count mismatch: ${file}`)
        usedGenerated.add(file)
      }
      for (const reference of references) {
        if (reference === undefined) {
          if (allowance) continue
          throw new Error(`Unverifiable module reference in ${file}`)
        }
        if (/^https?:/.test(reference) && extname(file) === '.css') continue
        if (reference.startsWith('.')) {
          const target = relative(root, resolve(dirname(file), reference))
          if (target === '..' || target.startsWith(`..${sep}`)) throw new Error(`${file} imports outside this repository`)
        } else {
          if (reference.startsWith('node:') || builtinModules.includes(reference)) continue
          const name = reference.startsWith('@') ? reference.split('/').slice(0, 2).join('/') : reference.split('/')[0]
          if (!declared[name]) throw new Error(`Undeclared dependency ${name} in ${file}`)
          if (exported.has(name) && !Object.hasOwn(exported.get(name), `.${reference.slice(name.length)}`)) throw new Error(`Private package import: ${reference}`)
        }
      }
    }
  }
  for (const directory of directories) await visit(resolve(root, directory))
  for (const file of generated.keys()) if (!usedGenerated.has(file)) throw new Error(`Unused generated-reference entry: ${file}`)
}
