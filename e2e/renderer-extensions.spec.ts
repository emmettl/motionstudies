import { expect, test } from '@playwright/test'

const state = async (page: import('@playwright/test').Page) => page.evaluate(() => {
  const probe = (globalThis as unknown as { rendererExtensionProbe: {
    positions: number; starts: number; disposals: number; childMounts: number; childDisposals: number;
    stop: number[];
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

test('camera drivers release ownership on replacement and unmount, and trails follow markers', async ({ page }) => {
  await expect.poll(async () => (await state(page)).trails.some(values => values.length > 0)).toBe(true)
  await page.getByRole('button', { name: 'Toggle driver' }).click()
  await expect.poll(async () => (await state(page)).camera).toEqual([7, 25, 18])
  await page.getByRole('button', { name: 'Toggle driver' }).click()
  await expect.poll(async () => (await state(page)).disposals).toBe(1)
  await expect.poll(async () => (await state(page)).camera).not.toEqual([7, 25, 18])
  await page.getByLabel('Position').selectOption('hidden')
  await expect.poll(async () => (await state(page)).trails.every(values => values.length === 0)).toBe(true)
  await page.getByLabel('Position').selectOption('default')
  await expect.poll(async () => (await state(page)).trails.some(values => values.length > 0)).toBe(true)
  await page.getByRole('button', { name: 'Toggle driver' }).click()
  const before = await state(page)
  await page.getByRole('button', { name: 'Toggle scene' }).click()
  await expect.poll(async () => (await state(page)).disposals).toBe(before.disposals + 1)
  expect((await state(page)).childDisposals).toBe(1)
})


test('spatial morphs retain rail buffers and restore source positions before replacement and removal', async ({ page }) => {
  const rail = async (retain = false) => page.evaluate(retain => {
    const probe = (globalThis as unknown as { rendererExtensionProbe: { scene: import('three').Scene; retained?: import('three').BufferGeometry } }).rendererExtensionProbe
    let geometry: import('three').BufferGeometry | undefined
    probe.scene.traverse(object => {
      const line = object as import('three').LineSegments
      if (!geometry && line.isLineSegments && line.renderOrder === 0 && line.geometry.getAttribute('position')?.count) geometry = line.geometry
    })
    if (retain) probe.retained = geometry
    return { uuid: geometry?.uuid, values: geometry ? Array.from(geometry.getAttribute('position').array).slice(0, 6) : [],
      retained: probe.retained ? Array.from(probe.retained.getAttribute('position').array).slice(0, 6) : [] }
  }, retain)
  await page.getByLabel('Morph', { exact: true }).selectOption('a')
  const original = await rail(true), stop = (await state(page)).stop
  await page.getByLabel('Layout mix', { exact: true }).fill('0.5')
  await expect.poll(async () => (await state(page)).stop[0]).toBeCloseTo(stop[0] + 10)
  const halfway = await rail()
  expect(halfway.uuid).toBe(original.uuid)
  expect(halfway.values[0]).toBeCloseTo(original.values[0] + 10)
  expect(halfway.values[2]).toBeCloseTo(original.values[2] - 2.5)
  await page.getByLabel('Morph', { exact: true }).selectOption('b')
  await expect.poll(async () => (await state(page)).stop[0]).toBeCloseTo(stop[0] - 5)
  const replaced = await rail()
  expect(replaced.uuid).toBe(original.uuid)
  expect(replaced.values[0]).toBeCloseTo(original.values[0] - 5)
  expect(replaced.values[2]).toBeCloseTo(original.values[2] + 4)
  await page.getByLabel('Morph', { exact: true }).selectOption('off')
  await expect.poll(async () => (await rail()).retained).toEqual(original.values)
  await page.getByLabel('Layout mix', { exact: true }).fill('0')
  await expect.poll(async () => (await state(page)).stop).toEqual(stop)
})
