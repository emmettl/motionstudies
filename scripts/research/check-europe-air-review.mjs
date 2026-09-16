import { chromium, webkit } from '@playwright/test'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
const root = 'work/europe-air-proof/2026-09-14'
const manifest = JSON.parse(await readFile(`${root}/review/manifest.json`, 'utf8'))
const out = `${root}/checks`
await mkdir(out, { recursive: true })
const results = []
for (const [name, engine, viewport] of [['chromium-desktop', chromium, { width: 1440, height: 1000 }], ['webkit-phone-layout', webkit, { width: 390, height: 844 }]]) {
  const browser = await engine.launch()
  try {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('http://127.0.0.1:4187/')
    await page.waitForFunction(() => window.proofState?.hour === 7)
    assert.equal(await page.evaluate(() => window.proofState.aircraft), manifest.hours[7].bins[0].aircraftAtInstant)
    const seek = async t => {
      await page.locator('#time').evaluate((element, value) => { element.value = value; element.dispatchEvent(new Event('input', { bubbles: true })) }, t)
      await page.waitForFunction(expected => window.proofState?.hour === Math.floor(expected / 3600) && window.proofState?.time === expected, t)
    }
    await seek(39600)
    assert.equal(await page.evaluate(() => window.proofState.aircraft), manifest.hours[11].bins[0].aircraftAtInstant)
    await page.evaluate(() => { window.proofMetrics.renderTimes.length = 0; window.proofMetrics.frameIntervals.length = 0 })
    await page.locator('#play').click()
    await page.waitForFunction(() => window.proofState.time >= 39840)
    await page.locator('#play').click()
    await seek(39600)
    await page.screenshot({ path: `${out}/${name}-motion.png` })
    const metrics = await page.evaluate(() => {
      const percentile = (a, q) => [...a].sort((a, b) => a - b)[Math.floor((a.length - 1) * q)]
      return { renderSamples: window.proofMetrics.renderTimes.length, renderP50Ms: percentile(window.proofMetrics.renderTimes, .5),
        renderP95Ms: percentile(window.proofMetrics.renderTimes, .95), rafP95Ms: percentile(window.proofMetrics.frameIntervals, .95),
        loads: window.proofMetrics.loads, usedJsHeapBytes: performance.memory?.usedJSHeapSize ?? null,
        state: window.proofState, horizontalOverflow: document.documentElement.scrollWidth > innerWidth }
    })
    assert.equal(metrics.horizontalOverflow, false)
    assert.ok(metrics.state.cacheHours.length <= 2)
    await page.locator('#region').click()
    await page.waitForFunction(() => window.proofState.regional)
    await page.screenshot({ path: `${out}/${name}-britain.png` })
    await page.locator('#density').click()
    await page.waitForFunction(() => document.getElementById('count').textContent.includes('observations'))
    assert.ok((await page.locator('#explanation').textContent()).includes('cannot compare volumes'))
    await page.screenshot({ path: `${out}/${name}-density.png` })
    await page.locator('#motion').click()
    await seek(86399)
    await seek(0)
    assert.equal(await page.evaluate(() => window.proofState.aircraft), manifest.hours[0].bins[0].aircraftAtInstant)
    await seek(3599)
    await page.locator('#play').click()
    await page.waitForFunction(() => window.proofState?.hour === 1 && window.proofState.time > 3600)
    await page.locator('#play').click()
    assert.deepEqual(errors, [])
    results.push({ name, engine: browser.version(), viewport, metrics, checks: ['source-consistent instant counts', 'play/pause', 'Britain view', 'hour accumulation', 'midnight boundaries', 'hour rollover', 'two-hour cache', 'no horizontal overflow', 'no JavaScript errors'] })
    if (name === 'chromium-desktop') {
      const failed = await browser.newPage({ viewport })
      await failed.route('**/hour-07.json.gz', route => route.fulfill({ status: 503, body: 'unavailable' }))
      await failed.goto('http://127.0.0.1:4187/')
      await failed.waitForFunction(() => document.getElementById('notice').textContent.includes('unavailable'))
      assert.equal(await failed.locator('#play').isDisabled(), true)
      await failed.close()
      results.at(-1).checks.push('missing chunk stays unavailable')
    }
  } finally { await browser.close() }
}
await writeFile(`${out}/browser.json`, JSON.stringify({ measuredAt: new Date().toISOString(), conditions: 'Headless browsers on author laptop; phone viewport is layout emulation, not physical-phone performance. Localhost transfer; no network throttling.', results }, null, 2) + '\n')
console.log(JSON.stringify(results, null, 2))
