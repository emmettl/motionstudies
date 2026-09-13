import { expect, test } from '@playwright/test'

test('Fields reads supported estimates, refuses unsupported places and exposes gaps as the clock moves', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Fields/ }).click()
  const canvas = page.getByTestId('field-canvas')
  const readout = page.getByTestId('field-readout')
  await expect(readout).toContainText('Click the field to read it')
  await expect(page.getByTestId('field-clock')).toHaveText('05:20 UTC')
  await expect(page.getByTestId('field-coverage')).toContainText('0 of 7 instruments missing')
  const box = (await canvas.boundingBox())!
  // Beside the instrument at 51.4°N 2.2°E: well supported, with a vector and a cover reading.
  await canvas.click({ position: { x: box.width * 2.3 / 6, y: box.height * (54 - 51.4) / 4 } })
  await expect(readout).toContainText('Estimate · support 1.00')
  await expect(readout).toContainText('"cover":')
  await expect(readout).toContainText('"sunAltitude":')
  // The south-east corner is beyond the 120 km reach of the nearest instrument at the default 45 km scale.
  await canvas.click({ position: { x: box.width * 0.995, y: box.height * 0.995 } })
  await expect(readout).toContainText('Unsupported: no evidence within reach')
  await page.getByLabel('Kernel scale').fill('200')
  await expect(readout).toContainText('Estimate · support')
  // Instrument 3 stops reporting between frames 8 and 14.
  await page.getByLabel('Field time').fill('10')
  await expect(page.getByTestId('field-clock')).toHaveText('05:50 UTC')
  await expect(page.getByTestId('field-coverage')).toContainText('1 of 7 instruments missing')
  await page.getByLabel('Field time').fill('20')
  await expect(page.getByTestId('field-clock')).toHaveText('06:40 UTC')
  await expect(page.getByTestId('field-coverage')).toContainText('0 of 7 instruments missing')
})
