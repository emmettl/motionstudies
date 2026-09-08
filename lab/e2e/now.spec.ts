import { expect, test } from '@playwright/test'

declare global {
  interface Window { rejectTestLocation?: () => void }
}

test('Now follows the wall clock, leaves on scrub and speed changes, and catches up after a gap', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-08T11:59:00Z') })
  await page.clock.pauseAt(new Date('2026-09-08T12:00:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: '06 Now' }).click()
  const now = page.getByRole('button', { name: 'Now', exact: true })
  await now.click()
  await expect(now).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Playback speed')).toHaveValue('1')
  await page.clock.runFor(2100)
  await expect(page.getByTestId('now-time')).toHaveText('12:00:02')
  await page.clock.fastForward(60_000)
  await expect(page.getByTestId('now-time')).toHaveText('12:01:02')
  await page.getByLabel('Now study time').fill('3600')
  await expect(now).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('now-time')).toHaveText('01:00:00')
  await now.click()
  await expect(page.getByTestId('now-time')).toHaveText('12:01:02')
  await page.getByLabel('Playback speed').selectOption('60')
  await expect(now).toHaveAttribute('aria-pressed', 'false')
  await now.click()
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await page.clock.runFor(2000)
  await expect(page.getByTestId('now-time')).toHaveText('12:01:02')
  await now.click()
  await page.clock.fastForward(24 * 60 * 60 * 1000)
  await expect(now).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByText('The current time is outside', { exact: false })).toBeVisible()
})

test('location is opt-in, can be cleared, and keeps an outside position off the map', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ longitude: 0.14, latitude: 0.13, accuracy: 25 })
  await page.goto('/')
  await page.getByRole('button', { name: '06 Now' }).click()
  await expect(page.getByRole('button', { name: 'Clear location' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(page.getByText('Your location · accuracy', { exact: false })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(1)
  await page.getByRole('button', { name: 'Clear location' }).click()
  await expect(page.getByText('Location stays in this browser.', { exact: false })).toBeVisible()
  await context.setGeolocation({ longitude: 8, latitude: 47 })
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(page.getByText('Your location is outside', { exact: false })).toBeVisible()
})

test('a declined or late location response does not interrupt Now', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { value: {
      getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
        window.rejectTestLocation = () => error({ code: 1 } as GeolocationPositionError)
      },
    } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: '06 Now' }).click()
  await page.getByRole('button', { name: 'Now', exact: true }).click()
  await page.getByRole('button', { name: 'Use my location' }).click()
  await expect(page.getByText('Finding your location…', { exact: true })).toBeVisible()
  await page.evaluate(() => window.rejectTestLocation?.())
  await expect(page.getByText('Location permission was declined.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Now', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Use my location' }).click()
  await page.getByRole('button', { name: 'Clear location' }).click()
  await page.evaluate(() => window.rejectTestLocation?.())
  await expect(page.getByText('Location stays in this browser.', { exact: false })).toBeVisible()
})
