import { expect, test } from '@playwright/test'

test('shared typefaces load from the consumer origin without third-party requests', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await page.goto('/')
  const loaded = await page.evaluate(async () => {
    const faces = [
      ...await document.fonts.load('400 16px Inter'),
      ...await document.fonts.load('600 16px Inter'),
      ...await document.fonts.load('300 16px "DM Mono"'),
      ...await document.fonts.load('500 16px "DM Mono"'),
    ]
    return faces.map((face) => `${face.family} ${face.weight} ${face.status}`)
  })
  expect(loaded.length).toBeGreaterThanOrEqual(4)
  expect(loaded.every((face) => face.endsWith(' loaded'))).toBe(true)
  const origin = new URL(page.url()).origin
  const fonts = requests.filter((url) => /\.woff2(?:$|\?)/.test(url))
  expect(fonts.length).toBeGreaterThanOrEqual(3)
  expect(fonts.every((url) => url.startsWith(origin))).toBe(true)
  expect(requests.filter((url) => /fonts\.(?:googleapis|gstatic)\.com/.test(url))).toEqual([])
})
