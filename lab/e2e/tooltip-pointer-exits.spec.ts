import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => { await page.goto('/') })

test('unrelated pointer exits preserve pending and visible keyboard help', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard help is intentionally absent on touch devices')
  const control = page.getByRole('button', { name: 'Vehicle labels', exact: true })
  const tooltip = page.getByRole('tooltip')
  await control.hover()
  await expect(tooltip).toBeVisible()
  await page.keyboard.press('Escape')
  await control.evaluate(button => {
    button.focus()
    // A scene/layout change can move a non-button out from under the pointer
    // in the same task that keyboard focus schedules the tooltip.
    document.body.dispatchEvent(new PointerEvent('pointerout', {
      bubbles: true, pointerType: 'mouse', relatedTarget: document.documentElement,
    }))
  })
  await expect(tooltip).toHaveText('Show vehicle labels on the map')
  await page.evaluate(() => document.body.dispatchEvent(new PointerEvent('pointerout', {
    bubbles: true, pointerType: 'mouse', relatedTarget: document.documentElement,
  })))
  await page.waitForTimeout(250)
  await expect(tooltip).toBeVisible()
})
