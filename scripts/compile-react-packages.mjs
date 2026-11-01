import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { parse } from '@babel/parser'
import { transform } from 'oxc-transform-react'

// Rewrite module specifiers only; strings displayed by components are untouched.
function rewriteExtensions(code) {
  const edits = []
  function visit(node) {
    if (!node || typeof node !== 'object') return
    let source
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type)) source = node.source
    if (node.type === 'ImportExpression') source = node.source
    if (source?.type === 'StringLiteral' && source.value.startsWith('.') && /\.tsx?$/.test(source.value)) {
      edits.push({ start: source.start, end: source.end, text: JSON.stringify(source.value.replace(/\.tsx?$/, '.js')) })
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(parse(code, { sourceType: 'module', createImportExpressions: true }))
  for (const edit of edits.sort((a, b) => b.start - a.start)) code = code.slice(0, edit.start) + edit.text + code.slice(edit.end)
  return code
}

/** Package-build prototype used by the benchmarks, not the production build.
 * Compile before JSX lowering, retaining TypeScript declarations and fallbacks.
 */
export async function compileReactPackage(sourceDirectory, outputDirectory, { include } = {}) {
  const compiled = [], skipped = []
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name)
      if (entry.isDirectory()) { await visit(file); continue }
      if (!/\.tsx?$/.test(file) || /\.test\.|\.d\.ts$/.test(file)) continue
      if (include && !include.includes(relative(sourceDirectory, file).replaceAll('\\', '/'))) continue
      const source = await readFile(file, 'utf8')
      if (!file.endsWith('.tsx') && !/from ['"](?:react|@react-three\/fiber)['"]/.test(source)) continue
      const result = await transform(file, source, { jsx: { runtime: 'automatic', development: false }, reactCompiler: { reportDiagnostics: true } })
      if (result.fatal) throw new Error(`React Compiler failed for ${file}: ${result.errors.map(e => e.message).join('; ')}`)
      if (result.code.includes('react/compiler-runtime')) {
        const output = join(outputDirectory, relative(sourceDirectory, file).replace(/\.tsx?$/, '.js'))
        await writeFile(output, rewriteExtensions(result.code))
        compiled.push(file)
      }
      for (const diagnostic of result.errors) skipped.push({ file, message: diagnostic.message })
    }
  }
  await visit(sourceDirectory)
  return { compiled, skipped }
}
