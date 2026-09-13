import { expect, test } from '@playwright/test'

async function fixtures(source: string) {
  const chunks = await Promise.all(Array.from({ length: 6 }, async (_, index) => {
    const start = index * 10, path = `${source}-${index}.json`
    const data = { format: 'network-patterns-v1', windowStart: start, windowEnd: start + 10,
      patterns: [{ route: 'R', shortName: 'R', headsign: 'End', category: 'bus', end: 9, stops: [[0, 0, 1], [1, 9, 9]] }], journeys: [[`${source}-${index}`, start, 0]] }
    const body = JSON.stringify(data)
    const bytes = new TextEncoder().encode(body)
    const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('')
    return { descriptor: { id: String(index), path, windowStart: start, windowEnd: start + 10, tripCount: 1, bytes: bytes.byteLength, sha256 }, body }
  }))
  return { chunks, manifest: { format: 'network-patterns-v1', metadata: { serviceDate: '2026-09-04', windowStart: 0, windowEnd: 60 },
    stops: [[0, 0, 'Start'], [1, 1, 'End']], edges: [[0, 1]], paths: [], bounds: [0, 0, 1, 1], tripCount: 6, chunks: chunks.map(chunk => chunk.descriptor) } }
}

test('loads lazily, evicts remote chunks, verifies bytes and retries without displaying another source', async ({ page }) => {
  const a = await fixtures('a'), b = await fixtures('b'), requests: string[] = []
  let failSecond = true
  await page.route('**/patterns/*.json', async route => {
    const name = route.request().url().split('/').at(-1)!
    requests.push(name)
    if (name === 'invalid.json') return route.fulfill({ json: { ...a.manifest, format: 'unsupported' } })
    if (name === 'a.json' || name === 'b.json') return route.fulfill({ json: name === 'a.json' ? a.manifest : b.manifest })
    if (name === 'a-2.json' && failSecond) return route.fulfill({ body: '{}', contentType: 'application/json' })
    const chunk = [...a.chunks, ...b.chunks].find(value => value.descriptor.path === name)!
    await route.fulfill({ body: chunk.body, contentType: 'application/json' })
  })
  await page.goto('/e2e/fixtures/pattern-day.html')
  expect(requests).toEqual([])
  await page.getByRole('button', { name: 'Toggle' }).click()
  const output = page.getByTestId('state')
  await expect(output).toHaveText('a-0')
  await expect.poll(() => requests.includes('a-1.json')).toBe(true)
  await page.getByLabel('Time').fill('25')
  await expect(output).toHaveAttribute('data-error', 'true')
  await expect(output).toBeEmpty()
  failSecond = false
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(output).toHaveText('a-2')
  await page.getByLabel('Time').fill('55')
  await expect(output).toHaveText('a-5')
  await expect.poll(() => requests.includes('a-4.json')).toBe(true)
  await page.getByLabel('Time').fill('5')
  await expect(output).toHaveText('a-0')
  await expect.poll(() => requests.filter(name => name === 'a-0.json').length).toBeGreaterThan(1)
  await page.getByLabel('Source').selectOption('b')
  await expect(output).toHaveText('b-0')
  await page.getByLabel('Source').selectOption('invalid')
  await expect(output).toHaveAttribute('data-error', 'true')
  await expect(output).toBeEmpty()
})
