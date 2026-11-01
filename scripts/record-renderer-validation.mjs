import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
const option = name => { const at=process.argv.indexOf(`--${name}`); if(at<0||!process.argv[at+1])throw Error(`Missing --${name}`); return process.argv[at+1] }
const read = async name => JSON.parse(await readFile(option(name),'utf8'))
const [broad,matrix,native,loaders]=await Promise.all(['packed','matrix','native','loaders'].map(read))
function cases(report) {
  const rows=[]
  function visit(suite, ancestors=[]) {
    for(const spec of suite.specs??[])for(const test of spec.tests) {
      const result=test.results.at(-1), title=[...ancestors,spec.title].join(' / ')
      rows.push({key:`${test.projectName}:${basename(spec.file)}:${title}`,project:test.projectName,file:basename(spec.file),title,status:result?.status??'missing',expected:test.expectedStatus,attachments:result?.attachments??[]})
    }
    for(const child of suite.suites??[])visit(child,child.file?[]:[...ancestors,child.title])
  }
  visit(report);return rows
}
const original=cases(broad), replacements=cases(matrix), nativeCases=cases(native), loaderCases=cases(loaders)
if(new Set(original.map(row=>row.key)).size!==original.length)throw Error('Ambiguous duplicate browser case identifiers')
const merged=new Map(original.map(row=>[row.key,row]));for(const row of replacements)merged.set(row.key,row)
const unexpected = row => row.status!=='passed'&&row.status!=='skipped'&&!(row.expected==='failed'&&row.status==='failed')
const errors=[...merged.values(),...nativeCases,...loaderCases].filter(unexpected)
if(errors.length||[broad,matrix,native,loaders].some(report=>report.errors?.length))throw Error(`Unresolved renderer validation failures: ${JSON.stringify(errors.map(({attachments:_attachments,...row})=>row))}`)
const backendReports=nativeCases.flatMap(row=>row.attachments.filter(a=>a.name?.endsWith('-report')).map(a=>JSON.parse(Buffer.from(a.body,'base64').toString('utf8'))))
if(!backendReports.some(report=>report.backend==='webgpu'&&report.pass))throw Error('No passing native WebGPU pixel/interaction report; fallback is not proof')
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim()
const inputs={}
for(const file of git('ls-files','--cached','--others','--exclude-standard').split('\n').sort()) {
  if(!/^(?:packages\/three\/src\/|lab\/(?:src\/|e2e\/|gpu-)|(?:packages\/three\/|lab\/)?package(?:-lock)?\.json$|playwright|scripts\/(?:audit-renderer|measure-renderer|record-renderer|check-packed))/.test(file)||!/(?:\.[cm]?[jt]sx?|\.json|\.html)$/.test(file))continue
  inputs[file]=createHash('sha256').update(await readFile(file)).digest('hex')
}
const count=rows=>({passed:rows.filter(r=>r.status==='passed').length,skipped:rows.filter(r=>r.status==='skipped').length,unexpected:rows.filter(unexpected).length})
const clean=({attachments:_attachments,...row})=>row
const manifest=JSON.parse(await readFile('package.json','utf8'))
const report={
  verifiedAt:new Date().toISOString(),sourceBaseCommit:git('merge-base','HEAD','origin/main'),branch:git('branch','--show-current'),
  candidateInputsSha256:createHash('sha256').update(JSON.stringify(inputs)).digest('hex'),inputs,
  versions:{node:process.version,fiber:manifest.dependencies['@react-three/fiber'],react:manifest.dependencies.react,three:manifest.dependencies.three},
  packed:{...count([...merged.values()]),broadRun:count(original),finalFrozenMatrix:count(replacements),resolvedInitialFailures:original.filter(unexpected).map(clean)},
  native:{...count(nativeCases),requiredBackend:'webgpu',reports:backendReports},loaders:count(loaderCases),
  visualReview:'Final legacy and native WebGPU canvas captures reviewed. Explicit display-space output preserves the faint halo; offscreen, final-canvas tile and halo-annulus energy checks pass.',
  limits:['Local working-tree edition inventory; deployments and downstream v10 adoption not inspected.','Renderer primitives and composed synthetic fixtures are validated; complete shared-scene node ports remain open.','Desktop WebKit mobile viewports are not physical-phone memory, thermal or sustained-frame evidence.','Frame intervals and first submission are CPU observations; Three counters are not total GPU/browser memory.'],
}
await writeFile(option('output'),JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({packed:report.packed,native:count(nativeCases),loaders:report.loaders},null,2))
