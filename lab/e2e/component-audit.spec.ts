import AxeBuilder from '@axe-core/playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import { studies } from '../src/studies.ts'
import { auditHosts, auditPresentations } from '../src/audit-cases.ts'

const reports: object[] = []
const cases = [...studies.map(s => ({ id: s.id, study: s.id, values: {} })), ...auditPresentations]

test.afterAll(async ({ browser }, info) => {
  const summary = { date: '2026-11-01', project: info.project.name, browserVersion: browser.version(), mode: process.env.MOTION_LAB_URL ? 'production' : 'development', cases: reports }
  await mkdir(info.outputDir, { recursive: true })
  await writeFile(resolve(info.outputDir, 'component-audit.json'), JSON.stringify(summary, null, 2))
  if (process.env.MOTION_LAB_AUDIT_CAPTURE === '1') {
    const destination = resolve('docs/evidence/lab-audit-2026-11-01')
    await mkdir(destination, { recursive: true })
    await writeFile(resolve(destination, `${info.project.name}.json`), JSON.stringify(summary, null, 2) + '\n')
  }
})

for (const specimen of cases) {
  test(`audit ${specimen.id} in every host`, async ({ page }, info) => {
    test.setTimeout(120_000)
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', m => { if (m.type() === 'error' && /shader|WebGLProgram|context lost/i.test(m.text())) errors.push(m.text()) })
    await page.clock.setFixedTime(new Date('2026-11-01T12:00:00Z'))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const host of auditHosts) {
      errors.length = 0
      await page.setViewportSize({ width: host.width, height: 900 })
      const query = new URLSearchParams({ study: specimen.study, host: host.host, text: String(host.text) })
      for (const [key, value] of Object.entries(specimen.values)) query.set(`v.${specimen.study}.${key}`, JSON.stringify(value))
      if (specimen.study === 'airports') query.set('scenario', 'airport-unavailable')
      if (specimen.study === 'panel-layout') query.set('v.panel-layout.width', String(Math.min(680, host.width - 32)))
      const url = `/host.html?${query}`
      await page.goto(url)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByText('Loading specimen…', { exact: true })).toHaveCount(0)
      await page.evaluate(() => document.fonts.ready)
      if (specimen.study === 'airports') await expect(page.getByText('Live updates unavailable.', { exact: true })).toBeVisible()
      const alerts = await page.getByRole('alert').allTextContents()
      const layout = await page.locator('main').evaluate(main => {
        const boundary = main.getBoundingClientRect()
        const selectors = '.mobile-picker,.ms-dot-matrix-board,.ms-split-flap-board,.ms-sbb-board,.ms-vehicle-hero,.ms-rail-station-hero,.ms-bus-stop-hero,.ms-airport-hero,.ms-study-timeline,.ms-timeline-scrubber,.scene-preview,.field-specimen'
        const outside = [...main.querySelectorAll<HTMLElement>(selectors)].filter(e => {
          const r = e.getBoundingClientRect()
          return r.width && (r.left < boundary.left - 1 || r.right > boundary.right + 1)
        }).map(e => ({ element: e.className, width: +e.getBoundingClientRect().width.toFixed(1), available: +boundary.width.toFixed(1) }))
        const overflowElements = document.documentElement.scrollWidth > innerWidth + 1 ? [...main.querySelectorAll<HTMLElement>('*')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0 }).slice(0, 12).map(e => ({ element: e.className || e.tagName, text: e.textContent?.trim().slice(0, 70), right: +e.getBoundingClientRect().right.toFixed(1) })) : []
        return { overflowElements, bodyOverflow: document.documentElement.scrollWidth > innerWidth + 1, bodyFontPixels: parseFloat(getComputedStyle(document.body).fontSize), outside }
      })
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      const violations = result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))
      const row = { specimen: specimen.id, study: specimen.study, host: host.id, width: host.width, text: host.text, url, layout, violations, errors: [...errors], alerts }
      reports.push(row)
      expect.soft(errors, `${specimen.id}/${host.id} runtime`).toEqual([])
      expect.soft(alerts, `${specimen.id}/${host.id} render`).toEqual([])
      expect.soft(layout.bodyOverflow, `${specimen.id}/${host.id} page bounds`).toBe(false)
      expect.soft(layout.outside, `${specimen.id}/${host.id} component bounds`).toEqual([])
      expect.soft(violations, `${specimen.id}/${host.id} accessibility`).toEqual([])
      if (host.id === 'large-text') expect.soft(layout.bodyFontPixels).toBe(40)
      await info.attach(`${specimen.id}-${host.id}`, { body: JSON.stringify(row, null, 2), contentType: 'application/json' })
      if ((['narrow', 'large-text'].includes(host.id) || layout.bodyOverflow || layout.outside.length || violations.length || errors.length || alerts.length) && ['terrain', 'network', 'network-policies', 'transport-heroes', 'vehicle-heroes'].includes(specimen.study)) await page.screenshot({ path: info.outputPath(`${specimen.id}-${host.id}.png`), fullPage: true, scale: 'css' })
    }
  })
}
