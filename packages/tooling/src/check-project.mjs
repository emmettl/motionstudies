import { lstat, readFile, readdir, realpath } from 'node:fs/promises'
import { builtinModules } from 'node:module'
import { dirname, relative, resolve, sep } from 'node:path'
import { moduleReferences } from '@motionstudies/data/module-references'
import { checkStack } from './stack.mjs'

const exactVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/
const isOutside = (root, file) => {
  const path = relative(root, file)
  return path === '..' || path.startsWith(`..${sep}`)
}
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const nameOf = (reference) =>
  reference.startsWith('@') ? reference.split('/').slice(0, 2).join('/') : reference.split('/')[0]

/** Check one application's declared source roots. Package hosts opt into workspaces.
 * `packages` selects registry packages to validate; an empty list requires none.
 * `manifests` adds workspace dependency declarations without importing source. */
export async function checkProject({
  root = '.',
  sources = ['src'],
  packages = [],
  manifests = [],
  allowWorkspaces = false,
  stack = true,
} = {}) {
  root = resolve(root)
  const manifest = await readJson(resolve(root, 'package.json'))
  if (manifest.workspaces && !allowWorkspaces)
    throw new Error('Workspaces require an explicit package-host policy')
  const metadata = [
    manifest,
    ...(await Promise.all(
      manifests.map((file) => {
        if (isOutside(root, resolve(root, file)))
          throw new Error('Manifest must stay inside the project')
        return readJson(resolve(root, file))
      }),
    )),
  ]
  const declared = Object.assign(
    {},
    ...metadata.map((value) => ({ ...value.dependencies, ...value.devDependencies })),
  )
  const failures = metadata.flatMap((value) => (stack ? checkStack(value) : []))
  for (const value of metadata)
    for (const [name, version] of Object.entries({
      ...value.dependencies,
      ...value.devDependencies,
    })) {
      if (declared[name] !== version) failures.push(`Conflicting dependency pin: ${name}`)
    }
  for (const [name, version] of Object.entries(declared)) {
    if (!exactVersion.test(version)) failures.push(`Expected an exact registry version: ${name}`)
  }
  const lock = await readJson(resolve(root, 'package-lock.json'))
  const publicExports = new Map()
  for (const name of packages) {
    if (!exactVersion.test(declared[name] ?? '')) {
      failures.push(`Missing exact package pin: ${name}`)
      continue
    }
    const entry = lock.packages?.[`node_modules/${name}`]
    if (
      entry?.version !== declared[name] ||
      !entry.resolved?.startsWith('https://registry.npmjs.org/') ||
      !entry.integrity?.startsWith('sha512-') ||
      entry.link
    )
      failures.push(`Registry lock mismatch: ${name}`)
    const directory = resolve(root, 'node_modules', name)
    if (
      (await lstat(directory)).isSymbolicLink() ||
      isOutside(await realpath(resolve(root, 'node_modules')), await realpath(directory))
    )
      failures.push(`Shared source link: ${name}`)
    const installed = await readJson(resolve(directory, 'package.json'))
    if (installed.version !== declared[name] || installed.private === true)
      failures.push(`Installed release mismatch: ${name}`)
    publicExports.set(name, installed.exports)
  }
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name)
      if (entry.isSymbolicLink()) {
        failures.push(`Source link is not permitted: ${file}`)
        continue
      }
      if (entry.isDirectory()) {
        await visit(file)
        continue
      }
      if (!/\.(?:[cm]?[jt]sx?|css)$/.test(file)) continue
      for (const reference of moduleReferences(await readFile(file, 'utf8'), file)) {
        if (reference === undefined) {
          failures.push(`Unverifiable module reference: ${file}`)
          continue
        }
        if (reference.startsWith('.')) {
          if (isOutside(root, resolve(dirname(file), reference)))
            failures.push(`Import leaves the project: ${reference}`)
        } else if (reference.startsWith('node:') || builtinModules.includes(reference)) continue
        else if (/^https?:/.test(reference) && file.endsWith('.css')) continue
        else {
          const name = nameOf(reference)
          if (!declared[name]) {
            failures.push(`Undeclared dependency: ${reference}`)
            continue
          }
          if (publicExports.has(name)) {
            const exports = publicExports.get(name)
            const subpath = `.${reference.slice(name.length)}`
            const exported =
              typeof exports === 'string' ? subpath === '.' : Object.hasOwn(exports ?? {}, subpath)
            if (!exported) failures.push(`Unsupported public import: ${reference}`)
          }
        }
      }
    }
  }
  for (const source of sources) {
    const directory = resolve(root, source)
    if (isOutside(root, directory)) throw new Error('Source roots must stay inside the project')
    if ((await lstat(directory)).isSymbolicLink()) throw new Error('Source roots cannot be links')
    await visit(directory)
  }
  if (failures.length) throw new Error(`Project boundary violations:\n- ${failures.join('\n- ')}`)
  return { packages: [...packages], sources: [...sources], manifests: metadata.length }
}
