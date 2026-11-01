import { createHash } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { parse } from '@babel/parser'
import { moduleReferences } from '../packages/data/src/module-references.mjs'

const editions = ['gleislicht', 'allchange', 'correspondances', 'luft', 'local-express', 'norikae', 'manifest', 'umlauf', 'zugunruhe', 'underfall', 'zenit', 'pfad', 'england', 'kraft', 'schwall']
const patterns = {
  glsl: /\b(?:ShaderMaterial|RawShaderMaterial|onBeforeCompile|gl_Position|gl_FragColor)\b/,
  points: /\b(?:PointsMaterial|pointsMaterial|PointsNodeMaterial|gl_PointSize)\b/,
  webgl: /\b(?:WebGLRenderer|webglcontextlost|webglcontextrestored|forceContextLoss|WebGL2RenderingContext|getContext\(\))\b/,
  frameClock: /\b(?:state\.clock|clock\.(?:elapsedTime|getElapsedTime|getDelta))\b/,
  postprocessing: /(?:EffectComposer|@react-three\/postprocessing|from ['"]postprocessing)/,
  canvas: /<Canvas\b|\bcreateRoot\s*\(/,
}
async function files(root, path) {
  const info = await stat(join(root, path)).catch(() => null)
  if (!info) return []
  if (!info.isDirectory()) return /(?:\.[cm]?[jt]sx?|\.html)$/.test(path) && !/\.(?:test|spec)\.[cm]?[jt]sx?$|\.d\.[cm]?ts$/.test(path) ? [path] : []
  return (await Promise.all((await readdir(join(root, path))).filter(name => !['node_modules', 'dist', 'data', '.cache'].includes(name)).sort().map(name => files(root, join(path, name))))).flat()
}
const index = process.argv.indexOf('--projects-root')
if (index < 0 || !process.argv[index + 1]) throw Error('Usage: node scripts/audit-renderer-readiness.mjs --projects-root /path/to/checkouts > report.json')
const root = resolve(process.argv[index + 1]), rows = []
for (const edition of editions) {
  const directory = join(root, edition)
  try {
    const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
    const deps = { ...manifest.dependencies, ...manifest.devDependencies }, imports = new Set(), findings = [], sourceHash = createHash('sha256')
    for (const path of [...await files(directory, 'src'), ...await files(directory, 'app'), ...await files(directory, 'index.html'), ...(await readdir(directory)).filter(name => /\.[cm]?jsx?$/.test(name)).flatMap(name => [name])]) {
      const source = await readFile(join(directory, path), 'utf8')
      sourceHash.update(path).update('\0').update(source).update('\0')
      if (!path.endsWith('.html')) for (const specifier of moduleReferences(source, path)) if (specifier && /^(?:@motionstudies\/three|@react-three\/|three(?:\/|$)|postprocessing)/.test(specifier)) imports.add(specifier)
      if (!path.endsWith('.html')) {
        const visit = node => {
          if (!node || typeof node !== 'object') return
          if (node.type === 'CallExpression' && node.callee?.name === 'useFrame') {
            const priority = node.arguments?.[1]
            if (priority?.type === 'NumericLiteral' || priority?.type === 'UnaryExpression' && priority.argument?.type === 'NumericLiteral') findings.push({kind:'framePriority',path,line:node.loc.start.line})
          }
          for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value)
        }
        visit(parse(source,{sourceType:'unambiguous',plugins:['typescript','jsx']}))
      }
      for (const [kind, pattern] of Object.entries(patterns)) {
        // Keep each affected source line; multi-line frame-priority matches point at their opening line.
        const matcher = new RegExp(pattern.source, 'g')
        for (const match of source.matchAll(matcher)) findings.push({ kind, path, line: source.slice(0, match.index).split('\n').length })
      }
    }
    const git = (...args) => execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' }).trim()
    const dirty = git('status', '--porcelain', '--untracked-files=normal')
    rows.push({ edition, commit: git('rev-parse', 'HEAD'), branch: git('branch', '--show-current'), dirtyEntries: dirty ? dirty.split('\n').length : 0,
      workingTreeSourceSha256: sourceHash.digest('hex'),
      manifestSha256: createHash('sha256').update(await readFile(join(directory,'package.json'))).digest('hex'),
      versions: Object.fromEntries(Object.entries(deps).filter(([name]) => /^(?:@motionstudies\/|@react-three\/|three$|react$|postprocessing$|r3f-perf$)/.test(name))),
      imports: [...imports].sort(), findings, sourceInspected: true, v10Validated: false, nativeWebGPUValidated: false, deployedBackend: 'not inspected' })
  } catch (error) { rows.push({ edition, sourceInspected: false, error: String(error) }) }
}
console.log(JSON.stringify({ inspectedAt: new Date().toISOString(), scope: 'Local working-tree source and manifests; no builds, runtime or deployment claims. Dirty entries include unrelated work. Findings are audit prompts, not proof of incompatibility.', editions: rows }, null, 2))
