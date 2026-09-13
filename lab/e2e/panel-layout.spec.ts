import { expect, test } from '@playwright/test'

test('panel clearance follows its container, retains evidence access and hides focusable chrome', async ({ page, isMobile }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Panel layout/ }).click()
  const viewport = page.locator('.panel-layout-specimen')
  const panel = viewport.locator('.ms-study-panel')
  for (const [width, height] of [[680, 540], [320, 380], [900, 700]]) {
    await page.getByRole('spinbutton', { name: 'Panel viewport width' }).fill(String(width))
    await page.getByRole('spinbutton', { name: 'Panel viewport height' }).fill(String(height))
    await expect.poll(async () => {
      const outer = await viewport.boundingBox(), inner = await panel.boundingBox()
      return Boolean(outer && inner && inner.x >= outer.x + 11 && inner.x + inner.width <= outer.x + outer.width - 11 && inner.y >= outer.y + 71 && inner.y + inner.height <= outer.y + outer.height - 79)
    }).toBe(true)
    const evidence = panel.getByRole('link')
    await evidence.focus()
    await expect(evidence).toBeInViewport()
    if (height <= 540) expect(await panel.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  }
  await page.getByLabel('Hide chrome').check()
  await expect(panel).toBeHidden()
  await page.getByLabel('Hide chrome').uncheck()
  await expect(panel).toBeVisible()
  const code = panel.locator('.ms-airport-hero__code')
  await expect(code).toHaveCSS('font-size', '40px')
  await page.getByLabel('Compact airport').uncheck()
  await expect(code).not.toHaveCSS('font-size', '40px')
  const control = viewport.getByRole('button', { name: 'Map', exact: true })
  if (isMobile) expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  else {
    await control.focus()
    await control.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(control).toHaveCSS('outline-style', 'solid')
  }
})
