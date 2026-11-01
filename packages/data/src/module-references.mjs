import { extname } from 'node:path'
import { parseSync } from 'oxc-parser'

/** Parse imports, re-exports, import types, side effects and dynamic imports. */
export function moduleReferences(source, fileName) {
  if (extname(fileName) === '.css') {
    return [...source.matchAll(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/g)].map((match) => match[1])
  }
  const references = []
  const { program, errors } = parseSync(fileName, source, { sourceType: 'module', preserveParens: false })
  if (errors.length) throw new SyntaxError(`Cannot parse ${fileName}: ${errors.map(error => error.message).join('; ')}`)
  function add(node) {
    references.push(node?.type === 'Literal' && typeof node.value === 'string' ? node.value : undefined)
  }
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) add(node.source)
    else if (node.type === 'ImportExpression') add(node.source)
    else if (node.type === 'TSImportType') add(node.source)
    else if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'require') add(node.arguments[0])
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(program)
  return references
}
