import assert from 'node:assert/strict'
import { cp, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const source = fileURLToPath(new URL('.', import.meta.url))
const manifest = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'))
const output = resolve(source, '../../.package-dist/tooling')
const runtimeIndex = process.argv.indexOf('--runtime-tarballs')
const runtimeDirectory = runtimeIndex < 0 ? undefined : process.argv[runtimeIndex + 1]
if (runtimeIndex >= 0 && !runtimeDirectory) throw new Error('--runtime-tarballs needs a directory')
const overrides = runtimeDirectory
  ? Object.fromEntries(
      ['core', 'data'].map((name) => [
        `@motionstudies/${name}`,
        `file:${resolve(runtimeDirectory, `motionstudies-${name}-${manifest.version}.tgz`)}`,
      ]),
    )
  : undefined
const temporary = await mkdtemp(resolve(tmpdir(), 'study-tooling-consumer-'))
function run(command, args, cwd = source) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: process.env })
  if (result.status !== 0)
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`)
  return result.stdout
}
run(process.execPath, ['build.mjs', '--release'])
const packed = Object.values(
  JSON.parse(
    run('npm', ['pack', output, '--pack-destination', temporary, '--json', '--ignore-scripts']),
  ),
)[0]
const tarball = resolve(temporary, packed.filename)
await writeFile(
  resolve(temporary, 'package.json'),
  JSON.stringify({
    name: 'tooling-packed-consumer',
    version: '0.0.0',
    private: true,
    type: 'module',
    ...(overrides ? { overrides } : {}),
  }),
)
run('npm', ['install', tarball, '--ignore-scripts', '--no-audit', '--no-fund'], temporary)
await mkdir(resolve(temporary, 'src'))
await writeFile(
  resolve(temporary, 'src/index.mjs'),
  "import { stack } from '@motionstudies/tooling/stack'; console.log(stack.nodeMajor)",
)
// The candidate itself is intentionally a tarball in this temporary verification consumer.
await writeFile(
  resolve(temporary, 'verify.mjs'),
  `
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { stack, checkStack } from '@motionstudies/tooling/stack'
import { checkProject } from '@motionstudies/tooling/check-project'
const require = createRequire(import.meta.url)
assert.equal(stack.nodeMajor, 26)
assert.deepEqual(checkStack({ dependencies: { react: stack.dependencies.react } }), [])
const base = JSON.parse(await readFile(require.resolve('@motionstudies/tooling/tsconfig/base.json'), 'utf8'))
assert.equal(base.compilerOptions.strict, true)
assert.equal(JSON.parse(await readFile(require.resolve('@motionstudies/tooling/oxlint.json'), 'utf8')).rules['react/rules-of-hooks'], 'error')
const formatting = JSON.parse(await readFile(require.resolve('@motionstudies/tooling/oxfmt.json'), 'utf8'))
assert.equal(formatting.semi, false)
assert.equal(formatting.singleQuote, true)
const consumer = process.argv[2]
if (consumer) {
  const localBase = JSON.parse(await readFile(consumer + '/tsconfig.base.json', 'utf8'))
  assert.deepEqual(localBase, base)
  const root = JSON.parse(await readFile(consumer + '/package.json', 'utf8'))
  assert.deepEqual(checkStack(root), [])
  const lab = JSON.parse(await readFile(consumer + '/lab/package.json', 'utf8'))
  assert.deepEqual(checkStack(lab), [])
  const { $schema, ignorePatterns, ...localFormatting } = JSON.parse(await readFile(consumer + '/.oxfmtrc.json', 'utf8'))
  assert.deepEqual(localFormatting, formatting)
  assert(ignorePatterns.includes('package-lock.json'))
  await checkProject({ root: consumer, allowWorkspaces: true, manifests: ['lab/package.json'], sources: ['lab/src', 'scripts'], packages: ['@motionstudies/web'] })
}
console.log('Packed exports, configs and consumer boundaries verified.')
`,
)
const consumerIndex = process.argv.indexOf('--consumer')
if (consumerIndex >= 0 && !process.argv[consumerIndex + 1])
  throw new Error('--consumer needs an absolute project path')
const consumer = consumerIndex >= 0 ? resolve(process.argv[consumerIndex + 1]) : undefined
console.log(
  run(process.execPath, ['verify.mjs', ...(consumer ? [consumer] : [])], temporary).trim(),
)
await writeFile(
  resolve(temporary, 'typed.mts'),
  `import { stack, checkStack } from '@motionstudies/tooling/stack'; import { checkProject, type ProjectPolicy } from '@motionstudies/tooling/check-project'; const policy: ProjectPolicy = { sources: ['src'], allowWorkspaces: true }; void checkProject(policy); checkStack({ dependencies: { react: stack.dependencies.react } });`,
)
await writeFile(
  resolve(temporary, 'tsconfig.json'),
  JSON.stringify({
    extends: '@motionstudies/tooling/tsconfig/base.json',
    compilerOptions: { types: [] },
    include: ['typed.mts'],
  }),
)
const formatter = resolve(source, '../../node_modules/.bin/oxfmt')
const formattingConfig = resolve(temporary, 'node_modules/@motionstudies/tooling/oxfmt.json')
run(formatter, ['--config', formattingConfig, '--write', 'typed.mts'], temporary)
run(formatter, ['--config', formattingConfig, '--check', 'typed.mts'], temporary)
run(
  process.execPath,
  [resolve(source, '../../node_modules/typescript/bin/tsc'), '-p', temporary],
  temporary,
)
run(
  resolve(source, '../../node_modules/.bin/oxlint'),
  ['--config', resolve(temporary, 'node_modules/@motionstudies/tooling/oxlint.json'), 'typed.mts'],
  temporary,
)
// Exercise checker policies in a clean consumer, with registry deps rather than workspace links.
await cp(resolve(source, 'test'), resolve(temporary, 'test'), { recursive: true })
for (const name of ['check-project.mjs', 'stack.mjs']) {
  await mkdir(resolve(temporary, 'src'), { recursive: true })
  await writeFile(
    resolve(temporary, 'src', name),
    `export * from '@motionstudies/tooling/${name.replace('.mjs', '')}'`,
  )
}
console.log(run(process.execPath, ['--test', 'test/check-project.test.mjs'], temporary).trim())
const bytes = await readFile(tarball)
const receipt = {
  version: manifest.version,
  tarball,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  integrity: packed.integrity,
  bytes: bytes.length,
}
assert(receipt.integrity.startsWith('sha512-'))
await writeFile(resolve(temporary, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`)
console.log(JSON.stringify(receipt, null, 2))
