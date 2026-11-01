import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { compileReactPackage } from './compile-react-packages.mjs'

const directories = []
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))) })
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'react-package-'))
  directories.push(directory)
  await mkdir(join(directory, 'src'))
  await mkdir(join(directory, 'out'))
  return directory
}

test('ships automatic memoization with public JS imports and declarations intact', async () => {
  const dir = await fixture()
  await writeFile(join(dir, 'src/Card.tsx'), `import { label } from './label.ts'; const loadDialog = () => import('./Dialog.tsx'); export function Card({ value }: { value: string }) { return <p onClick={loadDialog} title="./label.ts">{label(value)}</p> }`)
  await writeFile(join(dir, 'out/Card.d.ts'), 'export declare function Card(props: { value: string }): unknown\n')
  const helper = 'export function label(value) { return value.toUpperCase() }\n'
  await writeFile(join(dir, 'out/label.js'), helper)
  const result = await compileReactPackage(join(dir, 'src'), join(dir, 'out'))
  expect(result.compiled).toEqual([join(dir, 'src/Card.tsx')])
  const code = await readFile(join(dir, 'out/Card.js'), 'utf8')
  expect(code).toContain('react/compiler-runtime')
  expect(code).toContain('./label.js')
  expect(code).toContain('./Dialog.js')
  expect(code).toContain('./label.ts') // Displayed strings are not module specifiers.
  expect(await readFile(join(dir, 'out/Card.d.ts'), 'utf8')).toBe('export declare function Card(props: { value: string }): unknown\n')
  expect(await readFile(join(dir, 'out/label.js'), 'utf8')).toBe(helper)
})

test('preserves explicit compiler opt-outs byte for byte', async () => {
  const dir = await fixture()
  const source = `export function Card({ value }) { 'use no memo'; return <p>{value}</p> }`
  await writeFile(join(dir, 'src/Card.tsx'), source)
  await writeFile(join(dir, 'out/Card.js'), source)
  expect((await compileReactPackage(join(dir, 'src'), join(dir, 'out'))).compiled).toEqual([])
  expect(await readFile(join(dir, 'out/Card.js'), 'utf8')).toBe(source)
})

test('prevents publication of a fatally invalid React module', async () => {
  const dir = await fixture()
  await writeFile(join(dir, 'src/Broken.tsx'), `export function Broken( {`)
  await expect(compileReactPackage(join(dir, 'src'), join(dir, 'out'))).rejects.toThrow('React Compiler failed')
})

test('keeps unmeasured React modules on the TypeScript build', async () => {
  const dir = await fixture()
  await writeFile(join(dir, 'src/Card.tsx'), 'export function Card({ value }) { return <p>{value}</p> }')
  await writeFile(join(dir, 'out/Card.js'), '/* existing TypeScript output */')
  const result = await compileReactPackage(join(dir, 'src'), join(dir, 'out'), { include: ['Timeline.tsx'] })
  expect(result.compiled).toEqual([])
  expect(await readFile(join(dir, 'out/Card.js'), 'utf8')).toBe('/* existing TypeScript output */')
})
