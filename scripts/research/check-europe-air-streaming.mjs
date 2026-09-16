import { chromium, webkit } from '@playwright/test'
import { readFile, writeFile, copyFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const root = 'work/europe-air-proof/2026-09-14'
const template = 'scripts/research/europe-air-review.html'
await copyFile(template, `${root}/review/index.html`)
const results = []
const seek = async (page, time) => {
  await page.locator('#time').evaluate((input, value) => {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, time)
  await page.waitForFunction(t => window.proofState?.time === t && !window.proofState?.waiting, time)
}
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch()
  try {
    const page = await browser.newPage()
    const errors = [], requests = new Map()
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => {
      const hour = /hour-(\d+)\.json.gz/.exec(request.url())?.[1]
      if (hour) requests.set(hour, (requests.get(hour) ?? 0) + 1)
    })
    await page.goto('http://127.0.0.1:4187/')
    await page.waitForFunction(() => window.proofState?.cacheHours.includes(8))
    await page.evaluate(() => {
      window.streamingCheck = { notices: [], emptyFrames: 0, oversizeCaches: 0 }
      new MutationObserver(() => {
        const value = document.getElementById('notice').textContent
        if (value) window.streamingCheck.notices.push(value)
      }).observe(document.getElementById('notice'), { childList: true, characterData: true, subtree: true })
      const check = () => {
        if (window.proofState?.aircraft === 0) window.streamingCheck.emptyFrames++
        if (window.proofState?.cacheHours.length > 2) window.streamingCheck.oversizeCaches++
        requestAnimationFrame(check)
      }
      check()
    })
    await page.locator('#speed').selectOption('900')
    await page.locator('#play').click()
    await page.waitForFunction(() => window.proofState?.time >= 9 * 3600 + 120, undefined, { timeout: 20000 })
    await page.locator('#play').click()
    const streaming = await page.evaluate(() => window.streamingCheck)
    assert.deepEqual(streaming, { notices: [], emptyFrames: 0, oversizeCaches: 0 })
    for (const hour of ['07', '08', '09']) assert.equal(requests.get(hour), 1)
    assert.deepEqual(errors, [])
    await page.close()

    // Keep the next-hour prefetch pending until playback reaches its boundary.
    const slow = await browser.newPage()
    let release, nextRequests = 0
    const gate = new Promise(resolve => { release = resolve })
    await slow.route('**/hour-08.json.gz', async route => {
      nextRequests++
      await gate
      await route.continue()
    })
    await slow.goto('http://127.0.0.1:4187/')
    await slow.waitForFunction(() => window.proofState?.hour === 7)
    await seek(slow, 28799)
    await slow.locator('#speed').selectOption('900')
    await slow.locator('#play').click()
    await slow.waitForFunction(() => window.proofState?.waiting)
    const held = await slow.evaluate(async () => {
      const before = { ...window.proofState }
      for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame)
      return { before, after: window.proofState, notice: document.getElementById('notice').textContent,
        status: document.getElementById('loading').textContent }
    })
    assert.equal(held.before.time, 28799)
    assert.equal(held.after.time, 28799)
    assert.equal(held.after.hour, 7)
    assert.ok(held.after.aircraft > 0)
    assert.equal(held.notice, '')
    assert.match(held.status, /Buffering.*clock paused/)
    release()
    await slow.waitForFunction(() => window.proofState?.hour === 8 && !window.proofState.waiting)
    assert.equal(nextRequests, 1, 'Playback must reuse the pending prefetch')
    await slow.close()

    const failed = await browser.newPage()
    await failed.route('**/hour-08.json.gz', route => route.fulfill({ status: 503, body: 'unavailable' }))
    await failed.goto('http://127.0.0.1:4187/')
    await failed.waitForFunction(() => window.proofState?.hour === 7)
    await seek(failed, 28799)
    await failed.locator('#speed').selectOption('900')
    await failed.locator('#play').click()
    await failed.waitForFunction(() => document.getElementById('loading').textContent.includes('unavailable'))
    const failure = await failed.evaluate(() => ({ ...window.proofState,
      notice: document.getElementById('notice').textContent, button: document.getElementById('play').textContent }))
    assert.equal(failure.hour, 7)
    assert.equal(failure.time, 28799)
    assert.equal(failure.notice, '')
    assert.equal(failure.button, 'Play')
    await failed.close()
    results.push({ engine: name, version: browser.version(), speed: '15 simulated minutes per second', streaming,
      checks: ['successive warm hour transitions without loading overlay or empty frames', 'one request per needed hour',
        'maximum two cached hours', 'slow next hour holds valid frame and clock', 'pending prefetch reused by playback',
        'failed next hour pauses at valid frame with visible unavailable status', 'no JavaScript errors'] })
  } finally { await browser.close() }
}
const report = { measuredAt: new Date().toISOString(), reviewSourceSha256: createHash('sha256').update(await readFile(template)).digest('hex'),
  conditions: 'Headless browsers on author laptop, localhost; delayed/failed next-hour responses injected for recovery checks.', results }
await writeFile(`${root}/checks/streaming.json`, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
