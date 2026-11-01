import {readFile,readdir} from 'node:fs/promises'
import {join,relative} from 'node:path'
import {parse} from '@babel/parser'
const root='packages/three/src',failures=[]
async function check(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=join(directory,entry.name)
  if(entry.isDirectory()){await check(path);continue}
  if(!/\.tsx?$/.test(path)||/\.test\./.test(path))continue
  const file=relative(root,path),source=await readFile(path,'utf8')
  const fail=(node,message)=>failures.push(`${path}:${node.loc.start.line}: ${message}`)
  function visit(node){
   if(!node||typeof node!=='object')return
   if(node.source?.value?.startsWith('@react-three/fiber')&&file!=='webgl-study.ts')fail(node,'Import Fiber through the explicit WebGL study boundary')
   if(node.source?.value?.includes('/legacy'))fail(node,'/legacy is unavailable in stable Fiber 9')
   if(file!=='frame-state.ts'&&node.type==='MemberExpression'&&node.object?.name==='state'&&['gl','renderer','clock','elapsed'].includes(node.property?.name))fail(node,'Read frame renderer/time through frame-state')
   if(node.type==='CallExpression'&&['useFrame','useWebGLStudyFrame'].includes(node.callee?.name)){
    if(node.arguments.length>1&&file!=='use-camera-frame.ts')fail(node,'Keep ordered frame scheduling in use-camera-frame')
    const parameter=node.arguments[0]?.params?.[0]
    if(parameter?.type==='ObjectPattern'&&parameter.properties.some(p=>['gl','renderer','clock','elapsed'].includes(p.key?.name)))fail(node,'Read version-specific frame fields through frame-state')
   }
   for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value)
  }
  visit(parse(source,{sourceType:'module',plugins:['typescript','jsx']}))
 }
}
await check(root)
for(const path of ['package.json','lab/package.json']){
 const manifest=JSON.parse(await readFile(path,'utf8'))
 if(manifest.dependencies['@react-three/fiber']!=='9.8.2')failures.push(`${path}: exact stable Fiber 9.8.2 required`)
}
const peer=JSON.parse(await readFile('packages/three/package.json','utf8')).peerDependencies['@react-three/fiber']
if(peer!=='^9.8.2')failures.push('packages/three/package.json: only the validated 9.x peer range is supported')
if(failures.length)throw Error(`Renderer compatibility violations:\n${failures.join('\n')}`)
console.log('Stable Fiber 9.8.2 renderer boundaries hold.')
