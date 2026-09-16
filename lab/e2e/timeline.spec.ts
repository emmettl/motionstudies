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
  const x = box.x + 22 + (box.width - 44) * .75, y = box.y + box.height / 2
  if (isMobile) await page.touchscreen.tap(x, y)
  else {
    await page.mouse.move(box.x + 22, y); await page.mouse.down()
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
  await expect(slider).toHaveCSS('opacity', '0')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})


test('visible scrubber aligns its handle and finishes drags outside the control', async ({ page, isMobile }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Timeline/ }).click()
  const slider = page.getByRole('slider', { name: 'Recorded epoch time' })
  await expect(slider).toHaveAttribute('value', '1789386570.03125')
  await slider.press('Home')
  await expect(slider).toHaveValue('1789386120')
  await slider.press('ArrowRight')
  await expect(slider).toHaveValue('1789386121')
  await slider.press('End')
  await expect(slider).toHaveValue('1789389720')
  const control = slider.locator('..')
  const rail = (await control.locator('.ms-timeline-scrubber__rail').boundingBox())!
  const thumb = (await control.locator('.ms-timeline-scrubber__thumb').boundingBox())!
  expect(Math.abs(thumb.x + thumb.width / 2 - rail.x - rail.width)).toBeLessThan(1)
  expect(thumb.width).toBe(20)
  if (!isMobile) {
    const nativeThumb = await slider.evaluate(element => { const style = getComputedStyle(element, '::-webkit-slider-thumb'); return { width: style.width, height: style.height } })
    // WebKit/Chromium may expose the input's style rather than pseudo geometry;
    // touch behavior and the control bounds are exercised below on both engines.
    expect(Number.parseFloat(nativeThumb.height)).toBeGreaterThanOrEqual(44)
  }
  const box = (await slider.boundingBox())!
  expect(box.height).toBeGreaterThanOrEqual(44)
  if (!isMobile) {
    await page.mouse.move(box.x + box.width - 22, box.y + box.height / 2)
    await page.mouse.down()
    await expect(page.getByTestId('timeline-state')).toContainText('Scrubbing')
    await page.mouse.move(box.x + box.width / 2, box.y - 40, { steps: 4 })
    await page.mouse.up()
    await expect(page.getByTestId('timeline-state')).toContainText('Ready')
  } else {
    await page.touchscreen.tap(box.x + box.width / 2, box.y + 4)
    expect(Number(await slider.inputValue())).toBeGreaterThan(1789387800)
    expect(Number(await slider.inputValue())).toBeLessThan(1789388040)
  }
})
