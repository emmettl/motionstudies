import { expect, test } from '@playwright/test'

test('shared timeline supports keyboard, pointer, missing values and overnight windows', async ({ page, isMobile }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Timeline/ }).click()
  const slider = page.getByRole('slider', { name: 'Study time' })
  await expect(slider).toHaveValue('3600')
  await slider.fill('25000'); await expect(slider).toHaveValue('25000')
  await slider.focus(); await slider.press('Home')
  await expect(slider).toHaveValue('0')
  await expect(slider).toHaveAttribute('aria-valuetext', '00:00 · 0 vehicles')
  await slider.press('End'); await expect(slider).toHaveValue('28800')
  await expect(slider).toHaveAttribute('aria-valuetext', '08:00 · No observation')
  await slider.press('ArrowLeft'); await expect(slider).toHaveValue('28799')
  const box = (await slider.boundingBox())!
  const x = box.x + 9 + (box.width - 18) * .75, y = box.y + box.height / 2
  if (isMobile) await page.touchscreen.tap(x, y)
  else {
    await page.mouse.move(box.x + 9, y); await page.mouse.down()
    await page.mouse.move(x, y, { steps: 6 }); await page.mouse.up()
  }
  expect(Number(await slider.inputValue())).toBeGreaterThan(21000)
  expect(Number(await slider.inputValue())).toBeLessThan(22200)
  await expect(page.getByTestId('timeline-state')).toContainText('Ready')
  await page.getByRole('combobox', { name: 'Chart style' }).selectOption('line')
  await expect(page.locator('.ms-study-timeline polyline')).toHaveCount(2)
  await page.getByLabel('Empty data').check()
  await expect(page.locator('.ms-study-timeline__empty')).toHaveText('No observations in this window')
  await page.getByLabel('Empty data').uncheck()
  await page.getByLabel('Overnight window').check()
  await slider.focus(); await slider.press('End')
  await expect(slider).toHaveValue('100800')
  await expect(page.getByTestId('timeline-state')).toContainText('28:00')
  await page.getByLabel('Disabled', { exact: true }).check(); await expect(slider).toBeDisabled()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
