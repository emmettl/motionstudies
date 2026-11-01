import { expect, test, type Page } from '@playwright/test'

const child = (page: Page) => page.frameLocator('iframe[title$="validation host"]')
const audit = async (page: Page) => JSON.parse(await page.getByTestId('validation-metrics').innerText()) ?? {}
async function open(page: Page, study: string, scenario?: string) {
  await page.goto(`/?study=${study}&validate=1${scenario ? `&scenario=${scenario}` : ''}`)
  await expect(child(page).locator('canvas')).toBeVisible()
  await expect.poll(async () => (await audit(page)).renderers?.length).toBe(1)
  await child(page).locator('canvas').scrollIntoViewIfNeeded()
}

for (const study of ['terrain', 'network']) {
  test(`${study} releases retired contexts and recovers from repeated mounts and visibility changes`, async ({ page }) => {
    test.setTimeout(90_000)
    await open(page, study)
    const firstId = (await audit(page)).rendererLifetimes.at(-1).id
    await page.getByRole('button', { name: 'Hide specimen', exact: true }).click()
    await expect(child(page).locator('canvas')).toBeHidden()
    await page.getByRole('button', { name: 'Show specimen', exact: true }).click()
    await expect(child(page).locator('canvas')).toBeVisible()
    await child(page).locator('canvas').scrollIntoViewIfNeeded()
    await expect.poll(async () => (await audit(page)).renderers[0]?.frames).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Unmount specimen', exact: true }).click()
    await expect.poll(async () => (await audit(page)).renderers.length).toBe(0)
    await expect.poll(async () => (await audit(page)).rendererLifetimes.find((r: { id: number }) => r.id === firstId)?.contextLost).toBe(true)
    await page.getByRole('button', { name: 'Mount specimen', exact: true }).click()
    await expect.poll(async () => (await audit(page)).renderers.length).toBe(1)
    await page.getByRole('button', { name: 'Cycle mount ×10' }).click()
    await expect(page.getByTestId('cycle-status')).toHaveText('10 cycles completed')
    await child(page).locator('canvas').scrollIntoViewIfNeeded()
    await expect.poll(async () => (await audit(page)).renderers.length).toBe(1)
    await expect.poll(async () => {
      const records = (await audit(page)).rendererLifetimes
      return records.filter((r: { active: boolean; contextLost: boolean }) => !r.active && !r.contextLost).length
    }).toBe(0)
    await expect.poll(async () => (await audit(page)).renderers[0]?.frames).toBeGreaterThan(0)
    expect((await audit(page)).errors).toEqual([])
  })
}

test('terrain texture swaps and row adapters keep allocations bounded and preserve the GPU surface', async ({ page }) => {
  await open(page, 'terrain')
  const canvas = child(page).locator('canvas')
  const surface = async () => JSON.parse(await canvas.getAttribute('data-terrain-audit') ?? '{}')
  const geometry = (await surface()).geometry
  const swap = child(page).getByRole('button', { name: 'Swap height texture' })
  await swap.click(); await swap.click()
  await expect.poll(async () => (await surface()).phase).toBe(0)
  // Compare against a settled, warmed renderer rather than a telemetry sample from before upload.
  let previous = '', settled = 0
  await expect.poll(async () => {
    const r = (await audit(page)).renderers[0]
    const key = JSON.stringify([r.geometries, r.textures])
    settled = key === previous ? settled + 1 : 0; previous = key
    return settled
  }, { intervals: [300] }).toBeGreaterThanOrEqual(2)
  const baseline = (await audit(page)).renderers[0]
  for (let i = 0; i < 8; i++) {
    await swap.click()
    expect((await surface()).geometry).toBe(geometry)
  }
  await expect.poll(async () => (await audit(page)).renderers[0]?.geometries).toBeLessThanOrEqual(baseline.geometries)
  await expect.poll(async () => (await audit(page)).renderers[0]?.textures).toBeLessThanOrEqual(baseline.textures)
  const adapter = child(page).getByLabel('South-first texture adapter')
  for (let i = 0; i < 4; i++) { await adapter.check(); await adapter.uncheck() }
  await swap.click(); await swap.click()
  await expect.poll(async () => (await audit(page)).renderers[0]?.geometries).toBeLessThanOrEqual(baseline.geometries)
  await expect.poll(async () => (await audit(page)).renderers[0]?.textures).toBeLessThanOrEqual(baseline.textures)
  expect((await audit(page)).errors).toEqual([])
})
