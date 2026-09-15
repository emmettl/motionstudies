#!/usr/bin/env node
// Profile a public edition's first view on an emulated phone: paint, request waterfall and first WebGL frame.
// Usage: node scripts/profile-first-view.mjs [--runs 3] [--out results.json] [--unthrottled] <slug-or-url>...
import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { chromium, devices } from '@playwright/test'

// Lighthouse "devtools" mobile preset: 150 ms RTT x3.75, 1.6 Mbps x0.9 down, 750 kbps x0.9 up, 4x CPU.
export const THROTTLING = { latency: 562.5, downloadThroughput: 1638.4 * 0.9 * 1024 / 8, uploadThroughput: 750 * 0.9 * 1024 / 8, cpu: 4 }

/** Runs in the page before any application script. Counts WebGL draw calls per animation frame. */
function instrument() {
  const now = () => performance.now()
  const profile = window.__firstView = { frames: [], longTasks: [], paints: {} }
  let draws = 0
  for (const proto of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
    if (!proto) continue
    for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const original = proto[name]
      if (original) proto[name] = function (...args) { draws++; return original.apply(this, args) }
    }
  }
  const tick = () => {
    if (draws) { profile.frames.push([now(), draws]); draws = 0 }
    if (now() < 120000) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  try { new PerformanceObserver(list => { for (const e of list.getEntries()) profile.longTasks.push([e.startTime, e.duration]) }).observe({ type: 'longtask', buffered: true }) } catch {}
  try { new PerformanceObserver(list => { for (const e of list.getEntries()) profile.paints[e.name] = e.startTime }).observe({ type: 'paint', buffered: true }) } catch {}
}

/** One cold load. `prepare(page)` may install routes before navigation. */
export async function profileLoad(browser, { url, throttled = true, prepare, settleMs = 6000 }) {
  const context = await browser.newContext({ ...devices['Pixel 7'] })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Performance.enable')
  if (throttled) {
    const { cpu, ...network } = THROTTLING
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...network })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  }
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.addInitScript(instrument)
  if (prepare) await prepare(page)
  await page.goto(url, { waitUntil: 'load', timeout: 180000 })
  await page.waitForLoadState('networkidle', { timeout: 180000 }).catch(() => {})
  await page.waitForTimeout(settleMs)
  const result = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0]
    return {
      htmlEnd: navigation.responseEnd,
      resources: performance.getEntriesByType('resource').map(r => ({ name: r.name, type: r.initiatorType, start: r.startTime, end: r.responseEnd, transfer: r.transferSize })),
      ...window.__firstView,
    }
  })
  const { metrics } = await cdp.send('Performance.getMetrics')
  result.scriptMs = 1000 * (metrics.find(m => m.name === 'ScriptDuration')?.value ?? 0)
  result.errors = errors
  await context.close()
  return result
}

export function summarise(load) {
  const path = resource => new URL(resource.name).pathname
  const firstFrame = load.frames[0]?.[0] ?? null
  const data = load.resources.filter(r => /\.(json|bin|arrow|pbf)$/.test(path(r)))
  const beforeFrame = r => firstFrame == null || r.start < firstFrame
  return {
    firstPaint: load.paints['first-contentful-paint'] ?? null,
    firstDataRequest: data.length ? Math.min(...data.map(r => r.start)) : null,
    firstMapFrame: firstFrame,
    longTaskMsBeforeFrame: load.longTasks.filter(([start]) => firstFrame == null || start < firstFrame).reduce((sum, [, duration]) => sum + duration, 0),
    scriptMs: load.scriptMs,
    waterfall: load.resources.filter(r => beforeFrame(r) && /\.(js|css|json|bin|arrow|pbf|woff2?)$|fonts\.googleapis/.test(r.name))
      .sort((a, b) => a.start - b.start).map(r => `${Math.round(r.start)}→${Math.round(r.end)} ${path(r).split('/').pop()}`),
    errors: load.errors.length,
  }
}

const median = values => {
  const sorted = values.filter(v => v != null).sort((a, b) => a - b)
  return sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2 : null
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { runs: { type: 'string', default: '3' }, out: { type: 'string' }, unthrottled: { type: 'boolean', default: false } } })
  if (!positionals.length) throw new Error('Pass at least one edition slug or URL')
  const targets = positionals.map(target => target.startsWith('http') ? target : `https://motionstudies.app/${target}/`)
  const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] })
  const loads = []
  // Interleave targets so network and host drift spread across all of them.
  for (let run = 0; run < Number(values.runs); run++) {
    for (const url of targets) {
      const load = await profileLoad(browser, { url, throttled: !values.unthrottled })
      loads.push({ url, run, ...load })
      console.error(`${url} ${run + 1}/${values.runs}`)
    }
  }
  await browser.close()
  for (const url of targets) {
    const summaries = loads.filter(load => load.url === url).map(summarise)
    const row = key => Math.round(median(summaries.map(s => s[key])) ?? NaN)
    console.log(`\n${url} — medians of ${summaries.length} ${values.unthrottled ? 'unthrottled' : 'throttled'} loads (ms)`)
    console.log(`  first paint ${row('firstPaint')} · first data request ${row('firstDataRequest')} · first map frame ${row('firstMapFrame')} · long tasks before frame ${row('longTaskMsBeforeFrame')} · script ${row('scriptMs')}`)
    console.log(`  waterfall (first run):\n    ${summaries[0].waterfall.join('\n    ')}`)
    if (summaries.some(s => s.errors)) console.log(`  console or page errors in ${summaries.filter(s => s.errors).length} load(s)`)
  }
  if (values.out) await writeFile(values.out, JSON.stringify({ throttling: values.unthrottled ? null : THROTTLING, at: new Date().toISOString(), loads }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
