import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const source = fileURLToPath(new URL('.', import.meta.url))
const output = resolve(source, '../../.package-dist/tooling')
const manifest = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'))
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
for (const name of ['src', 'tsconfig', 'oxlint.json', 'README.md']) await cp(resolve(source, name), resolve(output, name), { recursive: true })
await cp(resolve(source, '../LICENSE'), resolve(output, 'LICENSE'))
const { scripts: _scripts, ...distribution } = manifest
distribution.private = !process.argv.includes('--release')
distribution.files = ['src', 'tsconfig', 'oxlint.json', 'README.md', 'LICENSE']
if (!distribution.private) distribution.publishConfig = { access: 'public', registry: 'https://registry.npmjs.org/', tag: 'next' }
await writeFile(resolve(output, 'package.json'), `${JSON.stringify(distribution, null, 2)}\n`)
console.log(output)
