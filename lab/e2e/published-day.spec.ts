import { expect, test } from '@playwright/test'

test('Published day opens the fixture, descends from a slice to a cell to one vehicle, and every figure comes from the files', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Published day/ }).click()
  await expect(page.getByTestId('published-day-status')).toContainText('Published day 2026-09-14: 2,001,468 samples, 26,432 vehicles, 362 operators; this fixture carries 3 slices and 2 operators.')
  await expect(page.getByTestId('published-day-slice')).toHaveText('12:00 UTC')
  await expect(page.getByTestId('published-day-readout')).toContainText('Click a cell')
  await page.getByRole('button', { name: 'Pick busiest cell' }).click()
  await expect(page.getByTestId('published-day-readout')).toContainText(/Cell -?\d+\.\d,\d+\.\d: \d+ samples from \d+ vehicles/)
  const members = page.getByTestId('published-day-members').getByRole('button')
  await expect(members.first()).toBeVisible()
  await members.first().click()
  await expect(page.getByTestId('published-day-vehicle')).toContainText(/samples over the day, \d+ journey runs; at 12:00\+2:30 (at \d+\.\d{4}, -?\d+\.\d{4}|not reporting)/)
  await page.getByLabel('Slice time').fill('2')
  await expect(page.getByTestId('published-day-slice')).toHaveText('12:10 UTC')
})
