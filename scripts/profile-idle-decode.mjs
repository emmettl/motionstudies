#!/usr/bin/env node
// Comparable production idle/playing samples and isolated JSON parse benchmarks.
// These are host measurements, not physical-phone benchmarks or full domain decode timings.
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { parseArgs } from 'node:util'
import { cpus, platform, arch } from 'node:os'
import { verifiedNetworkDayChunk } from '../packages/web/src/use-progressive-network-day.ts'
import { chromium } from '@playwright/test'

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  out: { type: 'string', default: '/private/tmp/motion-idle-decode' },
  runs: { type: 'string', default: '3' },
  duration: { type: 'string', default: '4000' },
} })
const runs = Number(values.runs), duration = Number(values.duration)
if (!Number.isInteger(runs) || runs < 1 || !Number.isFinite(duration) || duration < 1000) throw new Error('Invalid runs/duration')
const targets = positionals.length ? positionals : ['correspondances', 'allchange', 'gleislicht']
if (targets.some(target => !['correspondances', 'allchange', 'gleislicht'].includes(target))) throw new Error('Supported targets: correspondances, allchange, gleislicht')
await mkdir(values.out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=metal'] })
const results = []
function instrument() {
  window.__idleProbe = { draws: 0, uploads: 0, uploadSourceBytes: 0, zeroOpacityDraws: 0, frames: 0 }
  for (const proto of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
    if (!proto) continue
    const locations = new WeakMap(), opacity = new WeakMap()
    const programs = new WeakMap()
    const location = proto.getUniformLocation, uniform = proto.uniform1f, use = proto.useProgram
    proto.getUniformLocation = function (p, name) { const found = location.call(this, p, name); if (found) locations.set(found, { p, name }); return found }
    proto.uniform1f = function (loc, value) { const found = loc && locations.get(loc); if (found?.name === 'opacity') opacity.set(found.p, value); return uniform.call(this, loc, value) }
    proto.useProgram = function (p) { programs.set(this, p); return use.call(this, p) }
    for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced', 'bufferData', 'bufferSubData']) {
      const original = proto[name]
      if (!original) continue
      proto[name] = function (...args) {
        const p = window.__idleProbe
        if (name.startsWith('draw')) { const count = name.includes('Arrays') ? args[2] : args[1]; const instances = name.endsWith('Instanced') ? args.at(-1) : 1; if (count * instances > 0) p.draws++; const program = programs.get(this); if (count * instances > 0 && program && opacity.get(program) === 0) p.zeroOpacityDraws++ }
        else { p.uploads++; const data = args[name === 'bufferData' ? 1 : 2]; p.uploadSourceBytes += data?.byteLength ?? 0 }
        return original.apply(this, args)
      }
    }
  }
  let previous = 0, probe = window.__idleProbe
  const tick = () => { const p = window.__idleProbe; if (p !== probe) { probe = p; previous = 0 }; if (p.draws > previous) p.frames++; previous = p.draws; requestAnimationFrame(tick) }; requestAnimationFrame(tick)
}
function hot(profile) {
  const nodes = new Map(profile.nodes.map(n => [n.id, n.callFrame])), sums = new Map()
  for (let i = 0; i < (profile.samples?.length ?? 0); i++) {
    const f = nodes.get(profile.samples[i]), key = JSON.stringify(f)
    sums.set(key, (sums.get(key) ?? 0) + (profile.timeDeltas?.[i] ?? 0))
  }
  return [...sums].map(([key, us]) => ({ ...JSON.parse(key), milliseconds: us / 1000 })).sort((a, b) => b.milliseconds - a.milliseconds).slice(0, 30)
}
try {
  for (let run = 0; run < runs; run++) for (const target of targets) {
    const url = target.startsWith('http') ? target : `https://motionstudies.app/${target}/`
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'en-GB' })
    const page = await context.newPage(), cdp = await context.newCDPSession(page)
    const errors = [], payloads = new Map(), pending = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('response', response => {
      if (!/\.json(?:\?|$)/.test(response.url()) || !response.ok() || response.url().includes('_release.json')) return
      pending.push(response.text().then(text => { if (text.length <= 8 * 1024 * 1024) payloads.set(response.url(), text) }).catch(() => {}))
    })
    await page.addInitScript(instrument)
    await cdp.send('Performance.enable'); await cdp.send('Profiler.enable')
    await cdp.send('Profiler.setSamplingInterval', { interval: 1000 })
    const releaseUrl = new URL('_release.json', url).href
    const release = await (await context.request.get(releaseUrl)).json()
    const previous = results.find(result => result.target === target)
    if (previous && previous.release.commit !== release.commit) throw new Error(`Release changed between runs: ${target}`)
    await cdp.send('Profiler.start')
    await page.goto(url, { waitUntil: 'load', timeout: 90000 })
    await page.locator('canvas').first().waitFor({ timeout: 60000 })
    await page.waitForTimeout(6000)
    const startup = (await cdp.send('Profiler.stop')).profile
    const phases = []
    const slug = new URL(url).pathname.split('/').filter(Boolean).at(-1)
    const timeline = slug === 'allchange' ? page.locator('.london-transport input[type="range"]') : slug === 'gleislicht' ? page.locator('.scrubber input[type="range"]') : page.getByRole('slider', { name: 'Heure', exact: true })
    for (const name of ['playing', 'paused']) {
      const pause = page.getByRole('button', { name: /^(Pause|Pause motion)$/i }).first()
      if (await pause.count()) await pause.click()
      await timeline.fill('28800')
      await page.waitForTimeout(3000)
      if (name === 'playing') {
        await page.getByRole('button', { name: /^(Lecture|Resume motion)$/i }).first().click()
      }
      const studyTimeBefore = await timeline.inputValue()
      await page.evaluate(() => { window.__idleProbe = { draws: 0, uploads: 0, uploadSourceBytes: 0, zeroOpacityDraws: 0, frames: 0 } })
      await cdp.send('Profiler.start')
      const before = (await cdp.send('Performance.getMetrics')).metrics
      await page.waitForTimeout(duration)
      const after = (await cdp.send('Performance.getMetrics')).metrics
      const profile = (await cdp.send('Profiler.stop')).profile
      const counts = await page.evaluate(() => window.__idleProbe)
      const studyTimeAfter = await timeline.inputValue()
      if (name === 'paused' && studyTimeBefore !== studyTimeAfter) throw new Error(`Paused clock moved at ${url}`)
      phases.push({ name, duration, studyTimeBefore, studyTimeAfter, ...counts, milliseconds: Object.fromEntries(['TaskDuration', 'ScriptDuration', 'LayoutDuration'].map(key => [key, 1000 * (after.find(m => m.name === key).value - before.find(m => m.name === key).value)])), hot: hot(profile) })
      await writeFile(`${values.out}/${target.split('/').filter(Boolean).at(-1)}-${run}-${name}.cpuprofile`, JSON.stringify(profile))
    }
    await Promise.allSettled(pending)
    const decode = []
    for (const [asset, text] of [...payloads].sort((a, b) => b[1].length - a[1].length).slice(0, 5)) {
      const samples = await page.evaluate(text => {
        const times = []
        for (let i = 0; i < 9; i++) { const start = performance.now(); const parsed = JSON.parse(text); times.push(performance.now() - start); if (!parsed) throw new Error('Invalid benchmark payload') }
        return times.slice(2).sort((a, b) => a - b)
      }, text)
      const verifiedSamples = await page.evaluate(async ({ text, source, sha256 }) => {
        const read = Function(`return (${source})`)()
        const bytes = new TextEncoder().encode(text), times = []
        for (let i = 0; i < 7; i++) {
          const response = new Response(bytes), start = performance.now()
          await read(response, { id: 'profile', bytes: bytes.byteLength, sha256 })
          times.push(performance.now() - start)
        }
        return times.slice(2).sort((a, b) => a - b)
      }, { text, source: verifiedNetworkDayChunk.toString(), sha256: createHash('sha256').update(text).digest('hex') })
      decode.push({ asset, verifiedReadMedianMs: verifiedSamples[2], verifiedSamples, sha256: createHash('sha256').update(text).digest('hex'), utf8Bytes: Buffer.byteLength(text), parseMedianMs: samples[3], samples })
    }
    const afterRelease = await (await context.request.get(releaseUrl + '?after=1')).json()
    if (release.commit !== afterRelease.commit) throw new Error(`Release changed during ${target}`)
    const result = { target, run, url, capturedAt: new Date().toISOString(), release, errors, phases, decode, startupHot: hot(startup) }
    results.push(result)
    await writeFile(`${values.out}/results.json`, JSON.stringify({ uploadSourceBytesMeaning: 'Sum of source view capacities passed to buffer upload calls, not GPU transfer bandwidth; WebGL2 subranges are not inferred', method: '1440x900 DPR1 Chromium Metal; unthrottled; 08:00 fixed study seek before each phase; CPU sampled at 1ms. Isolated JSON.parse and actual shared verifiedNetworkDayChunk (body read, SHA256, UTF8, parse) on captured payloads; transfer/domain expansion excluded', host: { cpu: cpus()[0].model, platform: platform(), arch: arch() }, chromium: browser.version(), node: process.version, results }, null, 2))
    console.log(JSON.stringify({ target, run, commit: release.commit, phases: phases.map(({ hot: _hot, ...phase }) => phase), decode: decode.map(({ samples: _samples, ...asset }) => asset), errors }))
    await context.close()
  }
} finally { await browser.close() }
