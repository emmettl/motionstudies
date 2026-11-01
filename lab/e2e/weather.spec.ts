import { expect, test } from '@playwright/test'
test('weather preserves instant interpolation, interval means and exclusive coverage',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram/i.test(m.text()))errors.push(m.text())})
 await page.goto('/');await page.getByRole('button',{name:/Weather/}).click()
 await expect(page.getByTestId('weather-value')).toHaveText('50 % · instant')
 const pixels=await page.getByLabel('Synthetic weather field').evaluate(canvas=>{
  const gl=(canvas as HTMLCanvasElement).getContext('webgl2')!
  const p=new Uint8Array(4);gl.readPixels(60,30,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return [...p]
 })
 expect(pixels[3]).toBe(255);expect(pixels[2]).toBeGreaterThan(pixels[0])
 await page.getByLabel('Weather variable').selectOption('radiation')
 await expect(page.getByTestId('weather-value')).toHaveText('100 W/m² · interval-mean')
 await page.getByLabel('Weather minute').fill('60')
 await expect(page.getByTestId('weather-value')).toHaveText('400 W/m² · interval-mean')
 await page.getByLabel('Weather minute').fill('120')
 await expect(page.getByTestId('weather-value')).toHaveText('Unavailable')
 expect(errors).toEqual([])
})
