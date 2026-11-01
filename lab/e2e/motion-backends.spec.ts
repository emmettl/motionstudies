import { expect, test } from '@playwright/test'

test('windowed point and line motion agrees across legacy and node backends', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  const results = []
  for (const backend of ['legacy', 'webgl2', 'auto']) {
    await page.goto(`/gpu-motion.html?backend=${backend}`)
    await expect(page.locator('[data-results]')).toHaveAttribute('data-result', 'pass')
    const report = JSON.parse(await page.locator('[data-results]').textContent() ?? '{}')
    expect(report.cases).toHaveLength(12)
    if (backend !== 'auto') expect(report.backend).toBe(backend)
    results.push(report)
    expect(await page.locator('[data-motion-debug]').count()).toBe(0)
  }
  for (const report of results.slice(1)) for (let k = 0; k < 12; k++) {
    const reference = results[0].cases[k], actual = report.cases[k]
    expect(actual.visible).toBe(reference.visible)
    for (let c = 0; c < 2; c++) if (reference.visible) expect(Math.abs(actual.channels[c].centre - reference.channels[c].centre)).toBeLessThanOrEqual(1)
  }
  expect(errors).toEqual([])
})

test('node debugging exports shaders without changing the clock and exits cleanly', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto('/gpu-motion.html?backend=auto&debug=perf')
  await expect(page.locator('[data-results]')).toHaveAttribute('data-result', 'pass')
  const debug = page.getByRole('complementary', { name: 'Edition GPU debugging' })
  await debug.getByRole('button', { name: 'Save GPU report', exact: true }).click()
  const before = JSON.parse(await debug.locator('[data-report]').textContent() ?? '{}')
  expect(before.motionstudies.edition).toBe('motion-backend-check')
  expect(before.motionstudies.playbackTime).toBe(6)
  expect(before.shaders.some((shader: { vertex: string }) => !!shader.vertex)).toBe(true)
  expect(before.motionstudies.errors).toEqual([])
  await debug.getByRole('button', { name: 'Save GPU report', exact: true }).click()
  expect(JSON.parse(await debug.locator('[data-report]').textContent() ?? '{}').motionstudies.playbackTime).toBe(6)
  await debug.getByRole('link', { name: 'Exit debugging (reload)' }).click()
  await expect(page.locator('[data-results]')).toHaveAttribute('data-result', 'pass')
  await expect(debug).toHaveCount(0)
  expect(errors).toEqual([])
})
