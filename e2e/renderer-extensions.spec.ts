import { expect, test } from '@playwright/test'

const state = async (page: import('@playwright/test').Page) => page.evaluate(() => {
  const probe = (globalThis as unknown as { rendererExtensionProbe: {
    positions: number; starts: number; disposals: number; childMounts: number; childDisposals: number;
    resets: number; submissions: number; backendDisposals: number; ids: string[]; stop: number[];
    camera?: { position: { toArray(): number[] } };
    scene?: { traverse(callback: (object: { renderOrder: number; isPoints?: boolean; isLineSegments?: boolean;
      geometry?: { drawRange: { count: number }; getAttribute(name: string): { array: ArrayLike<number> } } }) => void): void };
  } }).rendererExtensionProbe
  const vehicles: number[][] = [], trails: number[][] = []
  probe.scene?.traverse(object => {
    if (!object.geometry || !Number.isFinite(object.geometry.drawRange.count)) return
    const values = Array.from(object.geometry.getAttribute('position').array).slice(0, object.geometry.drawRange.count * 3)
    if (object.isPoints && object.renderOrder >= 10 && object.renderOrder <= 12) vehicles.push(values)
    if (object.isLineSegments && object.renderOrder >= 3 && object.renderOrder <= 5) trails.push(values)
  })
  return { ...probe, camera: probe.camera?.position.toArray(), scene: undefined, vehicles, trails }
})

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/fixtures/renderer-extensions.html')
  await expect.poll(async () => (await state(page)).positions).toBeGreaterThan(0)
})

test('scene children follow projection and position overrides invalidate paused vehicles', async ({ page }) => {
  const original = await state(page)
  await page.getByLabel('Position').selectOption('custom')
  await expect.poll(async () => (await state(page)).vehicles.flat().filter((_v, i) => i % 3 === 0)).toEqual([7, 7, 7, 7, 7, 7])
  await page.getByLabel('Position').selectOption('hidden')
  await expect.poll(async () => (await state(page)).vehicles.flat().length).toBe(0)
  await page.getByLabel('Position').selectOption('default')
  await expect.poll(async () => (await state(page)).vehicles.flat().length).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Toggle layout' }).click()
  await expect.poll(async () => (await state(page)).stop).not.toEqual(original.stop)
  expect((await state(page)).childMounts).toBe(1)
})

test('camera and trail backends release ownership on replacement and unmount', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle driver' }).click()
  await expect.poll(async () => (await state(page)).camera).toEqual([7, 25, 18])
  await page.getByRole('button', { name: 'Toggle driver' }).click()
  await expect.poll(async () => (await state(page)).disposals).toBe(1)
  await expect.poll(async () => (await state(page)).camera).not.toEqual([7, 25, 18])
  await page.getByRole('button', { name: 'Toggle backend' }).click()
  await expect.poll(async () => (await state(page)).submissions).toBeGreaterThan(0)
  await expect.poll(async () => (await state(page)).trails.some(values => values.length === 6 && values[0] === 7 && values[3] === 8)).toBe(true)
  expect((await state(page)).ids.sort()).toEqual(['one', 'two'])
  await page.getByRole('button', { name: 'Toggle backend' }).click()
  await expect.poll(async () => (await state(page)).backendDisposals).toBeGreaterThan(0)
  await expect.poll(async () => (await state(page)).trails.some(values => values.length === 6 && values[0] === 7 && values[3] === 8)).toBe(false)
  await page.getByRole('button', { name: 'Toggle driver' }).click()
  await page.getByRole('button', { name: 'Toggle backend' }).click()
  const before = await state(page)
  await page.getByRole('button', { name: 'Toggle scene' }).click()
  await expect.poll(async () => (await state(page)).disposals).toBe(before.disposals + 1)
  await expect.poll(async () => (await state(page)).backendDisposals).toBeGreaterThan(before.backendDisposals)
  expect((await state(page)).childDisposals).toBe(1)
})
