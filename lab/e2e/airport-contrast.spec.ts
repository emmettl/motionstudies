import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const at = new Date('2026-11-01T12:00:00Z'), seconds = at.getTime() / 1000
for (const available of [false, true]) {
  test(`airport ${available ? 'selected live detail' : 'availability message'} remains readable on a light host`, async ({ page }) => {
    await page.clock.setFixedTime(at)
    await page.route('**/api/airports/**', route => route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*' }, json: route.request().url().endsWith('/capabilities') ? { version: 1, enabled: available, airports: available ? ['ZRH'] : [] } : {
      version: 1, status: 'fresh', retryAfterSeconds: 300,
      snapshot: { airport: { iata: 'ZRH', name: 'Zurich Airport', city: 'Zürich', timeZone: 'Europe/Zurich' }, fetchedAt: seconds, freshUntil: seconds + 60, expiresAt: seconds + 120, windowStart: seconds - 3600, windowEnd: seconds + 7200,
        departures: [{ id: 'audit-flight', service: 'AUDIT 42', place: 'Controlled destination', scheduledTime: seconds + 600, gate: 'B1', status: 'On time' }], arrivals: [] },
    } }))
    await page.goto('/host.html?study=airports&host=light')
    if (available) {
      await expect(page.getByRole('button', { name: 'Now', exact: true })).toBeEnabled()
      await page.getByRole('button', { name: 'Now', exact: true }).click()
      await page.getByRole('button', { name: 'AUDIT 42', exact: true }).click()
      await expect(page.locator('.ms-airport-board__detail')).toContainText('Controlled destination')
    } else await expect(page.getByText('Live updates unavailable.', { exact: true })).toBeVisible()
    const result = await new AxeBuilder({ page }).include('.ms-airport-board').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([])
  })
}
