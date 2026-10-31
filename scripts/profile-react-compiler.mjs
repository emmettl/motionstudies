// Paired production builds and browser measurements; writes only to the evidence directory.
// Usage: node scripts/profile-react-compiler.mjs [lab lab:timeline allchange ...]
// COMPILER_SCOPE=app|web|ui|study|all|package; COMPILER_RUNS=5; COMPILER_EVIDENCE=/tmp/...
// package scope compares COMPILER_WEB_BASELINE_DIR and COMPILER_WEB_DIR aliases.
import { build, loadConfigFromFile } from 'vite'
import react from '@vitejs/plugin-react'
import { chromium } from '@playwright/test'
import { buildPackages, packageOutput } from './build-packages.mjs'
import { compileReactPackage } from './compile-react-packages.mjs'
import { labCompilerModules } from '../lab/react-compiler.mjs'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, readdir, mkdtemp, cp, symlink } from 'node:fs/promises'
import { resolve, join, extname } from 'node:path'
import { gzipSync } from 'node:zlib'
const workspace = resolve(import.meta.dirname, '..')
const studiesRoot = resolve(process.env.COMPILER_STUDIES_ROOT ?? join(workspace, '..'))
const output = resolve(process.env.COMPILER_EVIDENCE ?? '/tmp/motion-react-compiler')
const targets = process.argv.slice(2)
if (!targets.length) targets.push('lab', 'allchange', 'correspondances', 'gleislicht', 'luft', 'norikae', 'pfad', 'umlauf', 'underfall', 'zenit', 'manifest', 'grid84')
const runs = Number(process.env.COMPILER_RUNS ?? 5)
const scope = process.env.COMPILER_SCOPE ?? 'all'
await mkdir(output, { recursive: true })
let baselineWebDir = process.env.COMPILER_WEB_BASELINE_DIR
let compiledWebDir = process.env.COMPILER_WEB_DIR
if (scope === 'package' && (!baselineWebDir || !compiledWebDir)) {
  process.chdir(workspace)
  await buildPackages()
  const packageRoot = await mkdtemp(join(tmpdir(), 'compiler-web-'))
  baselineWebDir = join(packageRoot, 'baseline')
  compiledWebDir = join(packageRoot, 'compiler')
  await symlink(join(workspace, 'node_modules'), join(packageRoot, 'node_modules'))
  await cp(join(packageOutput, 'web'), baselineWebDir, { recursive: true })
  await cp(baselineWebDir, compiledWebDir, { recursive: true })
  await compileReactPackage(join(workspace, 'packages/web/src'), compiledWebDir, { include: labCompilerModules })
}
const results = []
const browser = await chromium.launch({ args: ['--use-angle=metal'] })
async function files(dir) { return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? files(join(dir,e.name)) : join(dir,e.name)))).flat() }
function cleanPlugins(plugins) { return plugins.flat(Infinity).filter(Boolean).filter(p => !p.name?.startsWith('vite:react')).map(p => { const copy = { ...p }; delete copy.closeBundle; return copy }) }
try {
for (const target of targets) {
 const [edition, scenario] = target.split(':')
 const root = edition === 'lab' ? join(workspace,'lab') : resolve(studiesRoot,edition)
 const configs = (await readdir(root)).filter(n => /^vite.config\./.test(n))
 const entry = { target, variants: {} }; results.push(entry)
 for (const enabled of [false,true]) {
  const variant = enabled ? 'compiler' : 'baseline', outDir = join(output,target,variant)
  process.chdir(root)
  const loaded = await loadConfigFromFile({ command:'build', mode:'production' },join(root,configs[0]))
  const config = loaded.config
  let packageAliases
  if(scope === 'package'){const directory=enabled ? compiledWebDir : baselineWebDir;const manifest=JSON.parse(await readFile(join(directory,'package.json'),'utf8'));packageAliases=Object.fromEntries(Object.entries(manifest.exports).map(([key,value])=>['@motionstudies/web'+key.slice(1),resolve(directory,typeof value === 'string' ? value : value.import)]))}
  const start = performance.now()
  const warnings = []
  await build({ ...config, configFile:false, root, publicDir:false, base:'./', logLevel:'error',
   plugins:[...cleanPlugins(config.plugins ?? []),react({ compiler: enabled && scope !== 'package' ? { reportDiagnostics:true, ...(scope === 'ui' ? { sources: [root + '/src/', '/packages/web/src/'] } : scope === 'study' ? { sources: [root + '/src/studies/StudyView.tsx'] } : {}) } : false, include: scope === 'web' ? /(?:packages|node_modules\/@motionstudies)\/web\/.*\.[tj]sx?$/ : scope === 'app' ? new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/src/.*\\.[tj]sx?$') : /\.[tj]sx?$/, exclude:/\/node_modules\/(?!@motionstudies\/)/ })],
   resolve: scope === 'package' ? { ...config.resolve, dedupe: [...(config.resolve?.dedupe ?? []), 'react', 'react-dom'], alias: { ...config.resolve?.alias, ...packageAliases } } : config.resolve,
   build:{ ...config.build, outDir, emptyOutDir:true, sourcemap:false },
   customLogger:{ info(){}, warn(m){warnings.push(m)}, warnOnce(m){warnings.push(m)}, error(m){console.error(m)}, clearScreen(){}, hasErrorLogged(){return false}, hasWarned:false },
  })
  const js = (await files(outDir)).filter(f => f.endsWith('.js'))
  let bytes=0,gzipBytes=0
  for(const f of js){const b=await readFile(f);bytes+=b.length;gzipBytes+=gzipSync(b).length}
  entry.variants[variant]={buildMs:performance.now()-start,jsBytes:bytes,gzipBytes,scope,warnings,samples:[]}
 }
 process.chdir(workspace)
 // Alternate order each run to reduce warm-up and thermal bias.
 for(let run=0;run<runs;run++) for(const variant of run%2 ? ['compiler','baseline']:['baseline','compiler']) {
  const outDir=join(output,target,variant)
  const server=createServer(async(req,res)=>{
   let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
   if(path.startsWith(`/${target}/`))path=path.slice(target.length+1)
   if(path.endsWith('/'))path+='index.html'
   for(const dir of [outDir,join(root,'public')])try{const f=resolve(dir,'.'+path);if(!f.startsWith(dir+'/'))continue;const b=await readFile(f);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.svg':'image/svg+xml','.wasm':'application/wasm','.woff2':'font/woff2'}[extname(f)]??'application/octet-stream'));res.end(b);return}catch{}
   res.statusCode=404;res.end('Missing '+path)
  });await new Promise(r=>server.listen(0,'127.0.0.1',r))
  const context=await browser.newContext({ viewport:{width:1280,height:800} });const watchdog=setTimeout(()=>context.close(),90000);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.setDefaultTimeout(15000)
  try{
   const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})
   await page.addInitScript(()=>{window.__probe={commits:0,renders:0,frames:[],last:0};window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,inject(){return 1},onCommitFiberRoot(id,root){window.__probe.commits++;function walk(n){if(!n)return;if(n.flags&1)window.__probe.renders++;walk(n.child);walk(n.sibling)}walk(root.current)},onCommitFiberUnmount(){},onPostCommitFiberRoot(){}};function tick(t){const p=window.__probe;if(p.last)p.frames.push(t-p.last);p.last=t;requestAnimationFrame(tick)}requestAnimationFrame(tick)})
   await page.goto(`http://127.0.0.1:${server.address().port}/${edition === 'grid84' ? '#/study/siop62-alert/2' : ''}`,{waitUntil:'load',timeout:90000});await page.waitForTimeout(2500)
   if(edition==='lab'){await page.getByRole('button',{name:scenario === 'timeline' ? /Timeline/ : scenario === 'hub' ? /Hub/ : /Network/}).first().click();await page.waitForTimeout(1000)}
   if(edition === 'zenit'){const explore=page.getByRole('button',{name:'Explore freely',exact:true});if(await explore.isVisible())await explore.click()}
   const controls=await page.locator('button,input[type=range]').evaluateAll(els=>els.map(e=>({tag:e.tagName,label:e.getAttribute('aria-label')??e.textContent,disabled:e.disabled,visible:!!e.getClientRects().length,min:e.min,max:e.max})));let playbackAction=null;const buttons=await page.getByRole('button').all();for(const b of buttons){const label=(await b.getAttribute('aria-label'))??await b.textContent();if(/^play$|^play (?:playback|study|motion|simulation)$|^resume\b|^start playback/i.test(label?.trim()??'')){if(await b.isVisible() && await b.isEnabled()){await b.click();playbackAction=label;break}}}
   await page.waitForTimeout(500)
   await page.evaluate(()=>{window.__probe={commits:0,renders:0,frames:[],last:0}})
   const metric=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));const before=await metric()
   await page.waitForTimeout(3500)
   const playback=await page.evaluate(()=>structuredClone(window.__probe));const after=await metric()
   const timeSliders=page.locator('input[type=range][aria-label*="time" i], input[type=range][aria-label*="progress" i]');const slider=(await timeSliders.count()?timeSliders:page.locator('input[type=range]')).first();let seek=null
   const pauseButtons=page.getByRole('button',{name:/^pause\b/i});for(const b of await pauseButtons.all()){if(await b.isVisible() && await b.isEnabled()){await b.click();break}}
   if(await slider.count() && await slider.isVisible() && await slider.isEnabled()){
    await page.evaluate(()=>{window.__probe={commits:0,renders:0,frames:[],last:0}});const a=await metric()
    await slider.evaluate(async el=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;const min=Number(el.min)||0,max=Number(el.max)||100,step=Number(el.step)||1;for(let i=0;i<120;i++){setter.call(el,String(Math.min(max,min+(max-min)*.25+i*step)));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(requestAnimationFrame)}})
    const b=await metric();seek={...await page.evaluate(()=>structuredClone(window.__probe)),scriptMs:(b.ScriptDuration-a.ScriptDuration)*1000,taskMs:(b.TaskDuration-a.TaskDuration)*1000}
   }
   entry.variants[variant].samples.push({run,errors,controls,playbackAction,title:await page.title(),canvas:await page.locator('canvas').count(),playback:{...playback,scriptMs:(after.ScriptDuration-before.ScriptDuration)*1000,taskMs:(after.TaskDuration-before.TaskDuration)*1000},seek})
  }catch(error){entry.variants[variant].samples.push({run,error:String(error),errors})}finally{clearTimeout(watchdog);await context.close();server.closeAllConnections();await new Promise(r=>server.close(r));console.log(target,variant,run)}
 }
 await writeFile(join(output,'results.json'),JSON.stringify(results,null,2));console.log('Measured',target)
}
}finally{await browser.close();process.chdir(workspace);await writeFile(join(output,'results.json'),JSON.stringify(results,null,2))}
