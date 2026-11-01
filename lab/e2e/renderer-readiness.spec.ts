import { expect, test, type Page } from '@playwright/test'

async function result(page: Page) {
  await expect(page.locator('[data-results]')).toHaveAttribute('data-result', 'pass')
  return JSON.parse(await page.locator('[data-results]').textContent() ?? '{}')
}
const native = !!process.env.MOTION_REQUIRE_WEBGPU
for (const backend of ['legacy', 'webgl2', ...(native ? ['webgpu'] : ['auto'])]) {
  test(`${backend}: glyph size, picking, camera, resize, backward seek and recreation`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message)); page.on('console', e => { if(e.type()==='error') errors.push(e.text()) })
    await page.goto(`/gpu-readiness.html?backend=${backend}`)
    const initial = await result(page)
    if (backend !== 'auto') expect(initial.backend).toBe(backend)
    expect(initial.frames).toHaveLength(12)
    expect(initial.frames.find((f: { name: string }) => f.name==='midpoint').extent[0]).toBeGreaterThan(20)
    const canvas = page.locator('#map canvas')
    await canvas.click({position:{x:128,y:102}})
    await expect(page.locator('[data-pick]')).toHaveText('Fixture journey selected')
    await page.getByRole('slider', {name:'Study time'}).fill('13.25'); await page.getByRole('slider', {name:'Study time'}).dispatchEvent('input')
    await expect(page.locator('#label')).toBeHidden()
    await page.getByRole('slider', {name:'Study time'}).fill('6'); await page.getByRole('slider', {name:'Study time'}).dispatchEvent('input')
    await expect(page.locator('#label')).toBeVisible()
    await page.getByRole('button',{name:'Zoom and pan'}).click()
    await canvas.click({position:{x:109,y:90}})
    await expect(page.locator('[data-pick]')).toHaveText('Fixture journey selected')
    await page.getByRole('button',{name:'Resize',exact:true}).click()
    await expect(canvas).toHaveAttribute('width','384')
    await canvas.click({position:{x:163,y:67}})
    await expect(page.locator('[data-pick]')).toHaveText('Fixture journey selected')
    for (let generation=2;generation<=4;generation++) {
      await page.getByRole('button',{name:'Recreate renderer'}).click()
      await expect(page.locator('#map')).toHaveAttribute('data-generation',String(generation))
      const next = await result(page)
      expect(next.renderer).toEqual(initial.renderer)
      await expect(page.locator('#map')).toHaveAttribute('data-time','6')
      await expect(page.locator('#map')).toHaveAttribute('data-zoom','true')
      await expect(canvas).toHaveCount(1)
    }
    await expect(page.getByRole('button',{name:'Lose graphics device'})).toBeVisible()
    await page.getByRole('button',{name:'Lose graphics device'}).click()
    await expect(page.locator('#map')).toHaveAttribute('data-generation','5')
    await result(page)
    await expect(page.locator('#map')).toHaveAttribute('data-recovery', initial.backend==='webgpu'?'webgpu-device-lost':'webgl-context-lost')
    await expect(page.locator('#map')).toHaveAttribute('data-time','6')
    await expect(page.locator('#map')).toHaveAttribute('data-zoom','true')
    await test.info().attach(`${backend}-report`, {body: JSON.stringify(await result(page),null,2),contentType:'application/json'})
    await test.info().attach(`${backend}-scene`, {body: await canvas.screenshot(),contentType:'image/png'})
    expect(errors).toEqual([])
  })
}

test('legacy and node composed frames preserve glyph footprints, light and context', async ({ page }) => {
  const reports: Awaited<ReturnType<typeof result>>[] = []
  for (const backend of ['legacy','webgl2',...(native ? ['webgpu'] : ['auto'])]) {
    await page.goto(`/gpu-readiness.html?backend=${backend}`); reports.push(await result(page))
  }
  for(const actual of reports.slice(1)) {
    for(let i=0;i<reports[0].frames.length;i++) {
      const a=reports[0].frames[i], b=actual.frames[i]
      expect(b.visible).toBe(a.visible)
      if(a.visible) {
        expect(Math.abs(a.centre[0]-b.centre[0])).toBeLessThan(1)
        expect(Math.abs(a.centre[1]-b.centre[1])).toBeLessThan(1)
        expect(Math.abs(a.extent[0]-b.extent[0])).toBeLessThanOrEqual(1)
        expect(Math.abs(a.energy-b.energy)/a.energy).toBeLessThan(.03)
      }
    }
    expect(actual.tiles.length).toBe(reports[0].tiles.length)
    const difference = actual.tiles.reduce((sum:number,value:number,i:number)=>sum+Math.abs(value-reports[0].tiles[i]),0)/actual.tiles.length
    expect(difference).toBeLessThan(.5)
    const screenDifference=actual.screenTiles.reduce((sum:number,value:number,i:number)=>sum+Math.abs(value-reports[0].screenTiles[i]),0)/actual.screenTiles.length
    expect(screenDifference).toBeLessThan(.5)
    for(let c=0;c<3;c++)expect(Math.abs(actual.haloEnergy[c]-reports[0].haloEnergy[c])/reports[0].haloEnergy[c]).toBeLessThan(.05)
  }
  await test.info().attach('paired-reports',{body:JSON.stringify(reports,null,2),contentType:'application/json'})
})

test('reduced motion opens at the completed position and manual seeking remains available', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('/gpu-readiness.html?backend=webgl2'); await result(page)
  await expect(page.locator('#map')).toHaveAttribute('data-time','11')
  await page.getByRole('slider', {name:'Study time'}).fill('6'); await page.getByRole('slider', {name:'Study time'}).dispatchEvent('input')
  await expect(page.locator('#map')).toHaveAttribute('data-time','6')
})

for(const backend of ['webgl2',...(native?['webgpu']:[])]) test(`v10 default Canvas initializes ${backend} and supplies finite scheduler values`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())})
  await page.goto(`/gpu-fiber.html?backend=${backend}`)
  await expect(page.locator('[data-fiber-status]')).toHaveAttribute('data-result','pass')
  const report=JSON.parse(await page.locator('[data-fiber-status]').textContent()??'{}')
  expect(report.backend).toBe(backend)
  for(const field of ['elapsed','time','delta'])expect(Number.isFinite(report[field])).toBe(true)
  await expect(page.locator('canvas')).toHaveCount(1)
  expect(errors).toEqual([])
})
