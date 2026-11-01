import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'

export const rendererRoots = ['packages/three/src', 'lab/src', 'e2e/fixtures']
const sensitive = new Set(['gl', 'renderer', 'clock', 'elapsed'])
const boundary = resolve('packages/three/src/webgl-study.ts')
const frameState = resolve('packages/three/src/frame-state.ts')
const cameraFrame = resolve('packages/three/src/use-camera-frame.ts')
const children = node => Object.values(node).flatMap(value => Array.isArray(value) ? value : [value]).filter(value => value && typeof value.type === 'string')
const key = node => node?.name ?? node?.value

/** Follow hook-produced state and callback bindings through lexical aliases. */
export function rendererCompatibilityViolations(file, source) {
  const path = resolve(file), failures = [], nodes = [], scopes = new WeakMap()
  const fail = (node, message) => failures.push(`${file}:${node.loc.start.line}: ${message}`)
  const lookup = (scope, name) => scope?.bindings.get(name) ?? (scope?.parent ? lookup(scope.parent, name) : undefined)
  function bind(pattern, scope) {
    if (!pattern) return
    if (pattern.type === 'Identifier') scope.bindings.set(pattern.name, {})
    else if (pattern.type === 'ObjectPattern') pattern.properties.forEach(p => bind(p.type === 'RestElement' ? p.argument : p.value, scope))
    else if (pattern.type === 'ArrayPattern') pattern.elements.forEach(p => bind(p, scope))
    else if (pattern.type === 'AssignmentPattern') bind(pattern.left, scope)
  }
  function collect(node, parentScope) {
    const functionNode = /Function/.test(node.type) || node.type === 'ObjectMethod'
    const scope = functionNode || node.type === 'Program' || node.type === 'BlockStatement' ? { parent: parentScope, bindings: new Map() } : parentScope
    scopes.set(node, scope); nodes.push(node)
    if (functionNode) node.params?.forEach(p => bind(p, scope))
    if (node.type === 'VariableDeclarator') bind(node.id, scope)
    if (node.type === 'ImportDeclaration') {
      for (const spec of node.specifiers) {
        bind(spec.local, scope)
        const imported = key(spec.imported)
        if (node.source.value.includes('webgl-study') || node.source.value.startsWith('@react-three/fiber')) {
          if (['useThree', 'useWebGLStudyState'].includes(imported)) lookup(scope, spec.local.name).kind = 'state-hook'
          if (['useFrame', 'useWebGLStudyFrame'].includes(imported)) lookup(scope, spec.local.name).kind = 'frame-hook'
        }
      }
    }
    children(node).forEach(child => collect(child, scope))
  }
  collect(parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] }), undefined)
  function kind(node) {
    if (!node) return undefined
    if (node.type === 'Identifier') return lookup(scopes.get(node), node.name)?.kind
    if (node.type === 'CallExpression' && kind(node.callee) === 'state-hook') return 'state'
    if (['TSAsExpression', 'TSNonNullExpression'].includes(node.type)) return kind(node.expression)
  }
  function mark(pattern, scope) {
    if (pattern?.type === 'Identifier') {
      const binding = lookup(scope, pattern.name)
      if (binding && binding.kind !== 'state') { binding.kind = 'state'; return true }
    }
    if (pattern?.type === 'ObjectPattern') return pattern.properties.filter(p => p.type === 'RestElement').map(p => mark(p.argument, scope)).some(Boolean)
    return false
  }
  // Iterate so a chain of aliases resolves regardless of declaration order.
  let changed
  do {
    changed = false
    for (const node of nodes) {
      if (node.type === 'CallExpression' && ['state-hook', 'frame-hook'].includes(kind(node.callee))) {
        const callback = node.arguments[0]
        if (callback?.params) changed = mark(callback.params[0], scopes.get(callback)) || changed
      }
      if (node.type === 'VariableDeclarator' && kind(node.init) === 'state') changed = mark(node.id, scopes.get(node)) || changed
      if (node.type === 'AssignmentExpression' && kind(node.right) === 'state') changed = mark(node.left, scopes.get(node)) || changed
    }
  } while (changed)
  function checkPattern(pattern) {
    if (pattern?.type === 'ObjectPattern' && pattern.properties.some(p => sensitive.has(key(p.key)))) fail(pattern, 'Read frame renderer/time through frame-state')
  }
  for (const node of nodes) {
    if (node.source?.value?.startsWith('@react-three/fiber') && path !== boundary) fail(node, 'Import Fiber through the explicit WebGL study boundary')
    if (node.source?.value?.startsWith('@react-three/fiber') && node.source.value.includes('/legacy')) fail(node, '/legacy is unavailable in stable Fiber 9')
    if (path !== frameState && path !== boundary) {
      if (['MemberExpression', 'OptionalMemberExpression'].includes(node.type) && kind(node.object) === 'state' && sensitive.has(key(node.property))) fail(node, 'Read frame renderer/time through frame-state')
      if (node.type === 'VariableDeclarator' && kind(node.init) === 'state') checkPattern(node.id)
      if (node.type === 'CallExpression' && ['state-hook', 'frame-hook'].includes(kind(node.callee))) checkPattern(node.arguments[0]?.params?.[0])
    }
    if (node.type === 'CallExpression' && kind(node.callee) === 'frame-hook' && node.arguments.length > 1 && path !== cameraFrame) fail(node, 'Keep ordered frame scheduling in use-camera-frame')
  }
  return failures
}

async function sources(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await sources(path))
    else if (/\.tsx?$/.test(path) && !/\.test\./.test(path)) files.push(path)
  }
  return files
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const files = (await Promise.all(rendererRoots.map(sources))).flat()
  const failures = (await Promise.all(files.map(async file => rendererCompatibilityViolations(file, await readFile(file, 'utf8'))))).flat()
  for (const path of ['package.json', 'lab/package.json']) {
    const manifest = JSON.parse(await readFile(path, 'utf8'))
    if (manifest.dependencies['@react-three/fiber'] !== '9.8.2') failures.push(`${path}: exact stable Fiber 9.8.2 required`)
  }
  const peer = JSON.parse(await readFile('packages/three/package.json', 'utf8')).peerDependencies['@react-three/fiber']
  if (peer !== '^9.8.2') failures.push('packages/three/package.json: only the validated 9.x peer range is supported')
  if (failures.length) throw Error(`Renderer compatibility violations:\n${failures.join('\n')}`)
  console.log(`Stable Fiber 9.8.2 renderer boundaries hold across ${rendererRoots.join(', ')}.`)
}
