import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const frame = (page: Page) => page.frameLocator('iframe[title$="validation host"]')
const metrics = async (page: Page) => (JSON.parse(await page.getByTestId('validation-metrics').innerText()) ?? {})
async function open(page: Page, study: string, extra = '') {
  await page.goto(`/?study=${study}&validate=1${extra}`)
  await expect(frame(page).getByRole('main')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Unmount specimen', exact: true })).toBeEnabled()
}

test('power-weather scenario keeps each isolated clock independent and replayable', async ({ page }) => {
  await open(page,'power-weather','&scenario=power-weather-gap&instances=2')
  const first=frame(page).getByRole('region',{name:'Instance 1',exact:true}),second=frame(page).getByRole('region',{name:'Instance 2',exact:true})
  await expect(first.getByTestId('area-exchange')).toHaveText('Exchange: Unavailable')
  await expect(first.getByTestId('weather-value')).toContainText('100 W/m²')
  await expect(second.getByTestId('area-exchange')).toHaveText('Exchange: -40 MW')
  await first.getByRole('slider',{name:'Power and weather minute'}).fill('60')
  await expect(first.getByTestId('area-exchange')).toHaveText('Exchange: 80 MW')
  await expect(second.getByTestId('area-exchange')).toHaveText('Exchange: -40 MW')
  await page.reload()
  await expect(first.getByTestId('area-exchange')).toHaveText('Exchange: 80 MW')
  await expect(first.getByTestId('weather-value')).toContainText('400 W/m²')
})

test('gallery controls and named scenarios survive reload and browser navigation', async ({ page }) => {
  await page.goto('/?study=power-days&scenario=power-repeat')
  await expect(page.getByTestId('power-clock')).toContainText('01:00 GMT')
  await page.getByRole('button', { name: '3600 s', exact: true }).click()
  await expect(page).toHaveURL(/v\.power-days\.time=3600/)
  await page.reload()
  await expect(page.getByTestId('power-clock')).toContainText('01:00 BST')
  await page.getByRole('button', { name: /Timeline$/ }).click()
  await expect(page.getByLabel('Chart style')).toBeVisible()
  await page.goBack()
  await expect(page.getByTestId('power-clock')).toContainText('01:00 BST')
})

test('iframe rejects gallery styling and loads only the selected component styles', async ({ page }, testInfo) => {
  await open(page, 'controls')
  await page.screenshot({ path: testInfo.outputPath('validation-workbench.png'), fullPage: true })
  await page.addStyleTag({ content: 'button { background: rgb(255, 0, 0) !important; border: 30px solid red !important; }' })
  const trigger = frame(page).getByRole('button', { name: 'cyan service' })
  await expect(trigger).not.toHaveCSS('border-top-width', '30px')
  const styles = await frame(page).locator('head').evaluate(() => [...document.styleSheets].flatMap(sheet => [...sheet.cssRules].map(rule => rule.cssText)).join('\n'))
  expect(styles).not.toContain('.lab-sidebar')
  expect(styles).not.toContain('.ms-airport-hero')
  await page.getByRole('combobox', { name: 'Host', exact: true }).selectOption('serif')
  await expect(frame(page).locator('body')).toHaveCSS('font-family', 'Georgia, serif')
  await expect(trigger).not.toHaveCSS('border-top-width', '30px')
})

test('two instances are independent through hide, replacement and repeated mount cycles', async ({ page }) => {
  await open(page, 'controls', '&instances=2')
  const first = frame(page).getByRole('region', { name: 'Instance 1', exact: true })
  const second = frame(page).getByRole('region', { name: 'Instance 2', exact: true })
  await expect(second).toBeVisible()
  await first.getByRole('button', { name: 'cyan service' }).click()
  await first.getByRole('option', { name: /Express/ }).click()
  await expect(first.getByRole('button', { name: 'cyan service' })).toContainText('Express')
  await expect(second.getByRole('button', { name: 'cyan service' })).toContainText('Local')
  await page.getByRole('button', { name: 'Hide specimen', exact: true }).click()
  await expect(first).toBeHidden()
  await page.getByRole('button', { name: 'Show specimen', exact: true }).click()
  await page.getByRole('button', { name: 'Cycle mount ×10' }).click()
  await expect(page.getByTestId('cycle-status')).toHaveText('10 cycles completed')
  await expect(first.getByRole('button', { name: 'cyan service' })).toContainText('Express')
  await expect(second.getByRole('button', { name: 'cyan service' })).toContainText('Local')
  await first.getByRole('button', { name: 'cyan service' }).click()
  await first.getByRole('option', { name: /Local/ }).click()
  await expect.poll(async () => (await metrics(page)).callbacks['0:value']).toBe(2)
  await page.reload()
  await expect(first.getByRole('button', { name: 'cyan service' })).toContainText('Local')
  await expect(second.getByRole('button', { name: 'cyan service' })).toContainText('Local')
})

test('polling settles to its baseline after component unmount while the iframe stays alive', async ({ page }) => {
  await open(page, 'data', '&scenario=polling')
  await expect(frame(page).getByText('"publisher": "Synthetic source a"', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Unmount specimen', exact: true }).click()
  await expect(frame(page).getByRole('button', { name: 'Start polling' })).toHaveCount(0)
  await expect.poll(async () => (await metrics(page)).mounted).toBe(false)
  await expect.poll(async () => (await metrics(page)).pendingRequests).toBe(0)
  const count = (await metrics(page)).requests
  // One complete polling interval plus a margin establishes that cleanup stopped the next request.
  await page.waitForTimeout(1300)
  expect((await metrics(page)).requests).toBe(count)
  await page.getByRole('button', { name: 'Mount specimen', exact: true }).click()
  await expect(frame(page).getByText('"publisher": "Synthetic source a"', { exact: false })).toBeVisible()
  await expect.poll(async () => (await metrics(page)).requests).toBeGreaterThan(count)
})

test('late source responses cannot replace the current isolated loader source', async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('**/observations-a.json', async route => { await pending; await route.fulfill({ path: 'lab/public/data/observations-a.json' }).catch(() => {}) })
  await open(page, 'data', '&scenario=polling')
  await expect.poll(async () => (await metrics(page)).pendingRequests).toBeGreaterThan(0)
  await frame(page).getByLabel('Observation source').selectOption('observations-b.json')
  await expect(frame(page).getByText('"publisher": "Synthetic source b"', { exact: false })).toBeVisible()
  release()
  await expect(frame(page).getByText('"publisher": "Synthetic source a"', { exact: false })).toHaveCount(0)
  await expect.poll(async () => (await metrics(page)).pendingRequests).toBe(0)
})

for (const study of ['controls', 'timeline', 'bus-boards']) {
  test(`${study} meets automated accessibility checks in its bare host`, async ({ page }) => {
    await page.goto(`/host.html?study=${study}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Loading specimen…' })).toHaveCount(0)
    // Wait for the actual component, rather than the Suspense fallback.
    await expect(page.locator(study === 'controls' ? '.mobile-picker' : study === 'timeline' ? '.motion-study' : '.bus-stop-specimen').first()).toBeVisible()
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([])
  })
}

test('stress labels remain selectable at narrow widths with enlarged text and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page, 'controls', '&scenario=stress-picker&text=200')
  for (const width of [280, 320, 760]) {
    await page.getByLabel('Host width').fill(String(width))
    const trigger = frame(page).getByRole('button', { name: 'cyan service' })
    await trigger.focus(); await trigger.press('ArrowDown')
    await expect(frame(page).getByRole('option', { name: /SyntheticDestinationWithout/ })).toBeVisible()
    await trigger.press('Escape')
    await expect(trigger).toBeFocused()
    expect(await trigger.evaluate(e => e.getBoundingClientRect().width)).toBeLessThanOrEqual(width)
  }
})

test('a settled paused scenario makes no requests or consumer callbacks during the performance sample', async ({ page }) => {
  await open(page, 'power-days', '&scenario=power-repeat')
  await expect(frame(page).getByTestId('power-clock')).toContainText('01:00 GMT')
  await page.getByRole('button', { name: 'Measure 5 seconds' }).click()
  await expect(page.getByTestId('performance-sample')).toBeVisible()
  const sample = JSON.parse(await page.getByTestId('performance-sample').innerText())
  expect(sample.metrics.requests).toBe(0)
  expect(sample.metrics.callbacks).toEqual({})
  if (sample.metrics.commits !== null) expect(sample.metrics.commits).toBeLessThanOrEqual(1)
  expect(sample.metrics.errors).toEqual([])
  expect(sample.scenario).toBe('power-repeat')
})


test('playback updates consumer time continuously while address-bar writes stay bounded', async ({ page }) => {
  await page.addInitScript(() => {
    const original = history.replaceState.bind(history)
    const counter = window as unknown as { labHistoryWrites: number }
    counter.labHistoryWrites = 0
    history.replaceState = (...args) => { counter.labHistoryWrites++; original(...args) }
  })
  await page.goto('/?study=network')
  await expect(page.getByTestId('study-time')).toHaveText('60 s')
  await page.evaluate(() => { (window as unknown as { labHistoryWrites: number }).labHistoryWrites = 0 })
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect.poll(async () => Number((await page.getByTestId('study-time').innerText()).split(' ')[0]), { timeout: 10000 }).toBeGreaterThan(72)
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  expect(await page.evaluate(() => (window as unknown as { labHistoryWrites: number }).labHistoryWrites)).toBeLessThan(22)
  const time = Number((await page.getByTestId('study-time').innerText()).split(' ')[0])
  await expect.poll(() => Math.abs(Number(new URL(page.url()).searchParams.get('v.network.time')) - time)).toBeLessThan(.6)
})

test('a numeric control changed immediately before reload retains its latest value', async ({ page }) => {
  await page.goto('/?study=power-days')
  await page.getByRole('button', { name: '1800 s', exact: true }).click()
  await page.getByRole('button', { name: '3600 s', exact: true }).click()
  await page.reload()
  await expect(page.getByTestId('power-clock')).toContainText('3600 s elapsed')
})
