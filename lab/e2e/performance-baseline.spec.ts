import { mkdir, writeFile } from 'node:fs/promises'
import { arch, platform } from 'node:os'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const rows: object[] = []
const cases = [
  { study: 'network', scenario: 'network-paused' },
  { study: 'terrain', scenario: 'terrain-adapter' },
  { study: 'vehicle-heroes', scenario: 'vehicle-sbb-paused' },
]
test.afterAll(async ({ browser }, info) => {
  const report = { date: '2026-11-01', project: info.project.name, browserVersion: browser.version(), platform: platform(), arch: arch(), mode: process.env.MOTION_LAB_URL ? 'production' : 'development', viewport: { width: 1600, height: 2400 }, host: { width: 760, height: 720, profile: 'bare' }, telemetryIntervalMs: 250, samplesPerCase: 3, cases: rows }
  await mkdir(info.outputDir, { recursive: true })
  await writeFile(resolve(info.outputDir, 'performance-baseline.json'), JSON.stringify(report, null, 2))
  if (process.env.MOTION_LAB_AUDIT_CAPTURE === '1') {
    const destination = resolve('docs/evidence/lab-audit-2026-11-01')
    await mkdir(destination, { recursive: true })
    await writeFile(resolve(destination, `performance-${info.project.name}.json`), JSON.stringify(report, null, 2) + '\n')
  }
})
for (const specimen of cases) {
  test(`baseline ${specimen.study} at fixed dimensions`, async ({ page }, info) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width: 1600, height: 2400 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(`/?study=${specimen.study}&validate=1&scenario=${specimen.scenario}&width=760&height=720`)
    const child = page.frameLocator('iframe[title$="validation host"]')
    await expect(child.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(child.getByText('Loading specimen…', { exact: true })).toHaveCount(0)
    if (specimen.study === 'terrain') {
      const swap = child.getByRole('button', { name: 'Swap height texture' })
      await swap.click(); await swap.click()
    }
    await expect(child.locator(specimen.study === 'vehicle-heroes' ? '.ms-vehicle-hero' : 'canvas')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Measure 5 seconds' })).toBeEnabled()
    const samples = []
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Measure 5 seconds' }).click()
      const rect = await page.locator('iframe').boundingBox()
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(2400)
      await expect(page.getByRole('button', { name: 'Measure 5 seconds' })).toBeEnabled()
      const sample = JSON.parse(await page.getByTestId('performance-sample').innerText())
      expect(sample.metrics.requests).toBe(0)
      expect(sample.metrics.callbacks).toEqual({})
      expect(sample.metrics.errors).toEqual([])
      if (specimen.study === 'terrain') expect(sample.metrics.renderers[0].framesSinceReset).toBeLessThanOrEqual(1)
      samples.push(sample)
    }
    const row = { ...specimen, samples }
    rows.push(row)
    await info.attach(`${specimen.study}-baseline`, { body: JSON.stringify(row, null, 2), contentType: 'application/json' })
  })
}
