import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { checkProject } from '../src/check-project.mjs'
import { checkStack, stack } from '../src/stack.mjs'

async function fixture(run) {
  const root = await mkdtemp(resolve(tmpdir(), 'study-boundary-'))
  const write = async (path, value) => {
    await mkdir(resolve(root, path, '..'), { recursive: true })
    await writeFile(resolve(root, path), typeof value === 'string' ? value : JSON.stringify(value))
  }
  try {
    await write('package.json', { type: 'module', dependencies: { '@example/widget': '1.0.0' } })
    await write('package-lock.json', {
      packages: {
        'node_modules/@example/widget': {
          version: '1.0.0',
          resolved: 'https://registry.npmjs.org/@example/widget/-/widget-1.0.0.tgz',
          integrity: 'sha512-fixture',
        },
      },
    })
    await write('node_modules/@example/widget/package.json', {
      name: '@example/widget',
      version: '1.0.0',
      type: 'module',
      exports: { './control': './control.mjs' },
    })
    await write('node_modules/@example/widget/control.mjs', 'export const control = 1')
    await write('src/main.ts', "import { control } from '@example/widget/control'; void control")
    await run(root, write)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('stack validates present dependencies without requiring all runtime packages', () => {
  assert.deepEqual(checkStack({ dependencies: { react: stack.dependencies.react } }), [])
  assert.match(checkStack({ dependencies: { react: '^19.3.1' } })[0], /Expected react/)
  assert(Object.isFrozen(stack.dependencies))
})

test('a selected registry package and public import pass without the other three packages', () =>
  fixture(async (root) => {
    assert.deepEqual((await checkProject({ root, packages: ['@example/widget'] })).packages, [
      '@example/widget',
    ])
  }))

test('supports import-only public exports without requiring a CommonJS condition', () =>
  fixture(async (root, write) => {
    await write('node_modules/@example/widget/package.json', {
      name: '@example/widget',
      version: '1.0.0',
      exports: { './control': { import: './control.mjs' } },
    })
    await checkProject({ root, packages: ['@example/widget'] })
  }))

test('workspace declarations cannot hide a conflicting exact package pin', () =>
  fixture(async (root, write) => {
    await write('lab/package.json', { dependencies: { '@example/widget': '2.0.0' } })
    await assert.rejects(
      checkProject({ root, manifests: ['lab/package.json'] }),
      /Conflicting dependency pin/,
    )
  }))

test('workspace policy is explicit and includes workspace pins', () =>
  fixture(async (root, write) => {
    await write('package.json', { workspaces: ['lab'] })
    await write('lab/package.json', { dependencies: { react: '^19.3.1' } })
    await assert.rejects(checkProject({ root }), /package-host policy/)
    await assert.rejects(
      checkProject({ root, allowWorkspaces: true, manifests: ['lab/package.json'] }),
      /Expected react|exact registry version/,
    )
  }))

test('rejects private exports, undeclared dependencies and sibling imports', () =>
  fixture(async (root, write) => {
    await write(
      'src/main.ts',
      "import '@example/widget/private'; import 'undeclared'; import '../../sibling/source.ts'",
    )
    await assert.rejects(checkProject({ root, packages: ['@example/widget'] }), (error) => {
      assert.match(error.message, /Unsupported public import/)
      assert.match(error.message, /Undeclared dependency/)
      assert.match(error.message, /Import leaves the project/)
      return true
    })
  }))

test('rejects dynamic import expressions whose boundary cannot be checked', () =>
  fixture(async (root, write) => {
    await write('src/main.ts', 'const name = location.hash; void import(name)')
    await assert.rejects(checkProject({ root }), /Unverifiable module reference/)
  }))

test('rejects lockfile drift and source links', () =>
  fixture(async (root, write) => {
    await write('package-lock.json', {
      packages: {
        'node_modules/@example/widget': {
          version: '2.0.0',
          resolved: 'file:../widget',
          link: true,
        },
      },
    })
    await assert.rejects(
      checkProject({ root, packages: ['@example/widget'] }),
      /Registry lock mismatch/,
    )
    await symlink(
      resolve(root, 'node_modules/@example/widget/control.mjs'),
      resolve(root, 'src/linked.mjs'),
    )
    await assert.rejects(checkProject({ root }), /Source link is not permitted/)
  }))

test('missing or external source roots fail rather than silently skipping checks', () =>
  fixture(async (root) => {
    await assert.rejects(checkProject({ root, sources: ['missing'] }), /ENOENT/)
    await assert.rejects(checkProject({ root, sources: ['../outside'] }), /inside the project/)
  }))
