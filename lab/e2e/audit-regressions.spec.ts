import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('the narrow settlement table can be reached and scrolled by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 312, height: 900 })
  await page.goto('/host.html?study=power-days&scenario=power-table')
  const evidence = page.getByRole('region', { name: 'Power settlement evidence' })
  await evidence.focus()
  await expect(evidence).toBeFocused()
  expect(await evidence.evaluate(e => e.scrollWidth > e.clientWidth)).toBe(true)
  await evidence.press('ArrowRight')
  await expect.poll(() => evidence.evaluate(e => e.scrollLeft)).toBeGreaterThan(0)
})

test('unavailable airport replay is local and remains legible without a muted token', async ({ page }) => {
  let externalRequests = 0
  await page.route('https://motionstudies.app/api/airports/**', route => { externalRequests++; return route.abort() })
  const response = page.waitForResponse(r => r.url().includes('/data/airport-unavailable/api/airports/v1/gleislicht/capabilities'))
  await page.goto('/host.html?study=airports&host=light&scenario=airport-unavailable')
  const capabilities = await response
  expect(capabilities.status()).toBe(200)
  expect(await capabilities.json()).toEqual({ version: 1, enabled: false, airports: [] })
  await expect(page.getByText('Live updates unavailable.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Now', exact: true })).toBeDisabled()
  await page.locator('html').evaluate(html => html.style.setProperty('--muted', 'initial'))
  const result = await new AxeBuilder({ page }).include('.ms-airport-board').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(result.violations).toEqual([])
  expect(externalRequests).toBe(0)
})
