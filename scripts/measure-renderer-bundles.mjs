import { readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
const root='lab/dist', manifest=JSON.parse(await readFile(join(root,'.vite/manifest.json'),'utf8'))
const entries=[]
for(const [name] of Object.entries(manifest).filter(([,entry])=>entry.isEntry)) {
  const seen=new Set(), visit=key=>{if(seen.has(key))return;seen.add(key);for(const dependency of manifest[key].imports??[])visit(dependency)}
  visit(name)
  const assets=await Promise.all([...seen].map(async key=>{const file=manifest[key].file,bytes=await readFile(join(root,file));return {file,bytes:bytes.length,gzipBytes:gzipSync(bytes).length}}))
  entries.push({entry:name,assets,bytes:assets.reduce((n,a)=>n+a.bytes,0),gzipBytes:assets.reduce((n,a)=>n+a.gzipBytes,0)})
}
const report={measuredAt:new Date().toISOString(),scope:'Static JavaScript entry dependency closures from a built lab. Lazy scene imports, CSS, fonts, data and server compression are excluded; not an edition first-view budget or a before/after speed claim.',entries}
const output=process.argv[2]
if(output)await writeFile(output,JSON.stringify(report,null,2)+'\n');else console.log(JSON.stringify(report,null,2))
