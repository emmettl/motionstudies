import { expect, test } from '@playwright/test'

for (const style of ['sbb', 'uk-rail', 'dot-matrix', 'airport']) {
  test(`${style} adapts to card widths independently of viewport and keeps updates selectable`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Transport heroes' }).click()
    if (style === 'airport' || style === 'dot-matrix') await page.getByRole('combobox', { name: 'Transport', exact: true }).selectOption(style === 'airport' ? 'airport' : 'bus')
    if (style !== 'airport') {
      await page.getByRole('combobox', { name: 'Hero presentation', exact: true }).selectOption(style)
      await page.getByRole('combobox', { name: 'Hero lines', exact: true }).selectOption('auto')
    }
    await page.getByLabel('Long hero destination').check()
    const hero = page.locator('.transport-hero-specimen > section')
    for (const width of [240, 280, 320, 360, 480, 600, 980]) {
      await page.locator('.transport-hero-specimen').evaluate((element, size) => { element.style.width = `${size}px` }, width)
      await expect.poll(() => hero.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), `hero overflow at ${width}px`).toBe(true)
      if (style === 'sbb') {
        const time = hero.locator('.ms-sbb-board__time').first()
        await expect.poll(() => time.evaluate((element) => element.scrollWidth <= element.clientWidth), `departure time clipped at ${width}px`).toBe(true)
        const track = hero.locator('.ms-sbb-board__platform').first()
        await expect.poll(() => track.evaluate((element) => element.scrollWidth <= element.clientWidth), `track clipped at ${width}px`).toBe(true)
        const destination = hero.locator('.ms-sbb-board__destination').first()
        await expect.poll(() => destination.evaluate((element) => element.clientWidth), `destination space at ${width}px`).toBeGreaterThanOrEqual(width * .3)
        const title = hero.locator('.ms-sbb-board__title')
        await expect.poll(() => title.evaluate((element) => element.scrollWidth <= element.clientWidth), `heading overflow at ${width}px`).toBe(true)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
    const select = hero.getByRole('table').getByRole('button').first()
    await select.focus()
    await page.keyboard.press('Enter')
    await expect(select).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Update departure' }).evaluate((button: HTMLButtonElement) => button.click())
    await expect(select).toBeFocused()
    // A mobile viewport still contains a requested wide card.
    await page.setViewportSize({ width: 320, height: 700 })
    await expect.poll(() => hero.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
}

for (const style of ['sbb', 'uk-rail', 'dot-matrix']) {
  test(`${style} fits short and tall boards with fixed and automatic rows`, async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Transport heroes' }).click()
    await page.getByRole('combobox', { name: 'Hero presentation', exact: true }).selectOption(style)
    const board = page.locator(style === 'sbb' ? '.ms-sbb-board' : '.transport-hero-specimen .ms-dot-matrix-board')
    for (const lines of ['3', '6', '10', '15', 'auto']) {
      await page.getByRole('combobox', { name: 'Hero lines', exact: true }).selectOption(lines)
      for (const height of [180, 260, 430, 640]) {
        await board.evaluate((element, size) => { element.style.height = `${size}px` }, height)
        await expect.poll(() => board.evaluate((element) => element.scrollHeight <= element.clientHeight + 1), `${lines} lines in ${height}px board`).toBe(true)
        if (lines !== 'auto') await expect(board).toHaveAttribute('data-lines', lines)
        const content = board.locator(style === 'sbb' ? '.ms-sbb-board__body' : '.ms-dot-matrix-board__screen')
        await expect.poll(() => content.evaluate((element) => element.scrollHeight <= element.clientHeight + 1), `${lines} lines exceed ${height}px body`).toBe(true)
        if (lines === 'auto' && style === 'sbb') {
          // Auto mode must preserve both lines of text rather than hiding overflow.
          const cell = board.locator('.ms-sbb-board__row [role="cell"]').nth(2)
          await expect.poll(() => cell.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true)
        }
      }
    }
    for (const state of ['loading', 'empty', 'error']) {
      await page.getByRole('combobox', { name: 'Hero state', exact: true }).selectOption(state)
      const hero = page.locator('.transport-hero-specimen > section')
      await expect(hero.getByRole('status')).toBeVisible()
      await expect.poll(() => hero.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    }
  })
}
