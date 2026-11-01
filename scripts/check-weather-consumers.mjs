// Isolated consumer migration checks; source checkouts and measured assets remain untouched.
import { cp, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { buildPackages, packageNames } from './build-packages.mjs'
const root=resolve('.'),output=await mkdtemp(join(tmpdir(),'motion-weather-consumers-'))
function run(command,args,cwd=root,capture=false){const r=spawnSync(command,args,{cwd,encoding:'utf8',stdio:capture?'pipe':'inherit'});if(r.error||r.status!==0)throw new Error(r.error?.message??`${command} failed: ${r.stderr}`);return r.stdout}
console.log(`Weather consumers: ${output}`)
await buildPackages()
const dependencies={},artifacts=[]
for(const name of packageNames){const [p]=JSON.parse(run('npm',['pack',join(root,'.package-dist',name),'--json','--pack-destination',output,'--cache',join(output,'cache')],root,true));const file=join(output,p.filename);dependencies[`@motionstudies/${name}`]=`file:${file}`;artifacts.push({name,file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')})}
for(const edition of ['zugunruhe','gleislicht']){
 const flag=process.argv.indexOf(`--${edition}`),source=resolve(flag>=0?process.argv[flag+1]:join(root,'..',edition)),target=join(output,edition)
 await mkdir(target)
 for(const entry of await readdir(source,{withFileTypes:true})){
  if(['src','scripts'].includes(entry.name)&&entry.isDirectory())await cp(join(source,entry.name),join(target,entry.name),{recursive:true})
  else if(entry.isFile()&&/^(package\.json|.*\.html|tsconfig.*\.json|vite.*\.[cm]?[jt]s|vitest.*\.[cm]?[jt]s)$/.test(entry.name))await cp(join(source,entry.name),join(target,entry.name))
  else if(['data','public','audio-studies','studies'].includes(entry.name)&&entry.isDirectory())await symlink(join(source,entry.name),join(target,entry.name),'dir')
 }
 const patch=join(root,'scripts/weather-migrations',edition+'.patch')
 const check=spawnSync('git',['apply','--check',patch],{cwd:target})
 if(check.status===0)run('git',['apply',patch],target);else run('git',['apply','--reverse','--check',patch],target)
 const manifest=JSON.parse(await readFile(join(target,'package.json'),'utf8'));manifest.dependencies={...manifest.dependencies,...dependencies};if(manifest.devDependencies)for(const key of Object.keys(dependencies))delete manifest.devDependencies[key]
 await writeFile(join(target,'package.json'),JSON.stringify(manifest,null,2)+'\n')
 run('npm',['install','--ignore-scripts','--no-audit','--no-fund','--cache',join(output,'cache')],target)
 if(edition==='zugunruhe'){
  run('npm',['test'],target)
  const parity=`
    import {readFile} from 'node:fs/promises';
    import assert from 'node:assert/strict';
    import {compileOpenMeteoWeather} from '@motionstudies/data/weather';
    const base=${JSON.stringify(source)};
    const provenance=JSON.parse(await readFile(base+'/data/provenance/cloud-night.json','utf8'));
    const original=JSON.parse(await readFile(base+'/data/processed/cloud-night.json','utf8'));
    const responses=(await Promise.all(provenance.sourceResponses.map(async s=>JSON.parse(await readFile(base+'/'+s.cache,'utf8'))))).flat();
    const sources=provenance.sourceResponses.map((s,i)=>({id:'row-'+i,url:s.url,sha256:s.sha256,publisher:'Open-Meteo / Copernicus',retrievedAt:new Date(provenance.retrieved).toISOString(),license:provenance.licence,attribution:provenance.attribution}));
    const variables=Object.fromEntries(Object.keys(original.frames[0]).map(key=>[key,{input:key,unit:'%',evidenceKind:'reanalysis',timeSupport:'instant'}]));
    const compiled=compileOpenMeteoWeather(responses,{grid:original.grid,sources,sourceIds:sources.map(s=>s.id),variables});
    for(const key of Object.keys(variables))for(let i=0;i<original.times.length;i++)assert.deepEqual(compiled.variables[key].frames[compiled.variables[key].times.indexOf(new Date(original.times[i]).toISOString())],original.frames[i][key]);
    console.log('Retained ERA5 cloud grid recompiles identically: '+original.grid.width*original.grid.height+' cells, '+original.times.length+' hours, four variables');
  `
  await writeFile(join(target,'weather-parity.mjs'),parity)
  run(process.execPath,['weather-parity.mjs'],target)
 }
 else {run('npx',['vitest','run','src/studies/orbital-clouds.test.ts','src/studies/orbital-cloud-material.test.ts'],target);run('npm',['run','typecheck'],target)}
 run('npm',['run','build'],target)
}
await writeFile(join(output,'report.json'),JSON.stringify({passed:true,artifacts},null,2)+'\n')
console.log(`Weather extraction checks passed: ${output}/report.json`)
