import { expect, test } from '@playwright/test'
const at = new Date('2026-09-12T12:00:00Z'), seconds = at.getTime() / 1000
function board() {
  return { version: 1, status: 'fresh', retryAfterSeconds: 300, snapshot: {
    airport: { iata: 'ZRH', name: 'Zurich Airport', city: 'Zürich', timeZone: 'Europe/Zurich' },
    fetchedAt: seconds, freshUntil: seconds + 60, expiresAt: seconds + 120,
    windowStart: seconds - 3600, windowEnd: seconds + 7200,
    departures: [{ id: 'test-live', service: 'TEST 42', place: 'Synthetic destination', scheduledTime: seconds + 600, revisedTime: seconds + 900, gate: 'B1', status: 'Delayed', tone: 'warning' }], arrivals: [],
  } }
}
test('Now uses a separate live board and returns to the untouched study', async ({ page }) => {
  await page.clock.install({ time: at })
  let paid = 0
  await page.route('**/api/airports/**', async (route) => {
    if (route.request().url().endsWith('/capabilities')) await route.fulfill({ json: { version: 1, enabled: true, airports: ['ZRH'] } })
    else { paid++; await route.fulfill({ json: board() }) }
  })
  await page.goto('/'); await page.getByRole('button', { name: '04 Airports' }).click()
  const now = page.getByRole('button', { name: 'Now', exact: true })
  await expect(now).toBeEnabled(); expect(paid).toBe(0)
  await now.click()
  const live = page.getByRole('region', { name: 'Zurich Airport', exact: true })
  await expect(live).toContainText('Local time 14:00')
  await expect(live.getByRole('button', { name: 'TEST 42' })).toBeVisible()
  await expect(live).toContainText('14:15')
  await live.getByRole('button', { name: 'TEST 42' }).click()
  await expect(page.getByTestId('selected-flight')).toHaveText('Select a flight number to inspect its movement.')
  await page.getByRole('button', { name: 'Study', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Northfield International', exact: true })).toContainText('Study time 08:32')
  const count = paid; await page.clock.fastForward(65000); expect(paid).toBe(count)
})
test('outages become stale, then unavailable, without presenting a recording as live', async ({ page }) => {
  await page.clock.install({ time: at })
  let fail = false
  await page.route('**/api/airports/**', async (route) => {
    if (fail) { await route.abort(); return }
    await route.fulfill({ json: route.request().url().endsWith('/capabilities') ? { version: 1, enabled: true, airports: ['ZRH'] } : board() })
  })
  await page.goto('/'); await page.getByRole('button', { name: '04 Airports' }).click()
  await page.getByRole('button', { name: 'Now', exact: true }).click()
  await expect(page.getByRole('button', { name: 'TEST 42' })).toBeVisible()
  fail = true; await page.clock.fastForward(65000)
  await expect(page.getByText(/Updates delayed/)).toBeVisible()
  await page.clock.fastForward(60000)
  await expect(page.getByRole('button', { name: 'TEST 42' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Return to study' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Northfield International', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Return to study' }).click()
  await expect(page.getByRole('region', { name: 'Northfield International', exact: true })).toBeVisible()
})
test('disabling the feed removes cached flights and preserves study access', async ({ page }) => {
  await page.clock.install({ time: at })
  let enabled = true
  await page.route('**/api/airports/**', async (route) => route.fulfill({ json: route.request().url().endsWith('/capabilities') ? { version: 1, enabled, airports: enabled ? ['ZRH'] : [] } : board() }))
  await page.goto('/'); await page.getByRole('button', { name: '04 Airports' }).click()
  await page.getByRole('button', { name: 'Now', exact: true }).click()
  await expect(page.getByRole('button', { name: 'TEST 42' })).toBeVisible()
  enabled = false; await page.clock.fastForward(65000)
  await expect(page.getByRole('button', { name: 'TEST 42' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Return to study' }).click()
  await expect(page.getByRole('button', { name: 'Now', exact: true })).toBeDisabled()
})
