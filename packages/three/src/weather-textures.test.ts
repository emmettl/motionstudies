import { expect, it, vi } from 'vitest'
import { createGridTexturePair, scalarGridPixels } from './weather-textures.ts'
it('uploads only changed frames, seeks deterministically, and refuses outside time',()=>{
 const frame=vi.fn((i:number)=>scalarGridPixels([i,-i,0,null]))
 const pair=createGridTexturePair({width:2,height:2,times:['2026-09-16T00:00Z','2026-09-16T01:00Z'],frame})
 expect(pair.update('2026-09-16T00:30Z')).toBe(true);expect(pair.uniforms.weatherBlend.value).toBe(.5);expect(frame).toHaveBeenCalledTimes(2)
 pair.update('2026-09-16T00:45Z');expect(frame).toHaveBeenCalledTimes(2)
 expect(pair.update('2026-09-16T02:00Z')).toBe(false)
 pair.update('2026-09-16T00:00Z');expect(pair.uniforms.weatherBlend.value).toBe(0)
 const dispose=vi.spyOn(pair.a,'dispose');pair.dispose();pair.dispose();expect(dispose).toHaveBeenCalledTimes(1);expect(()=>pair.update(0)).toThrow('disposed')
})
it('separates signed quantities, valid zero and missingness',()=>{expect([...scalarGridPixels([-10,0,null])]).toEqual([-10,0,0,1,0,0,0,1,0,0,0,0])})
it('uses native interval support for radiation and hides gaps',()=>{const pair=createGridTexturePair({width:2,height:2,times:['2026-09-16T00:00Z','2026-09-16T02:00Z'],timeSupport:'interval-mean',intervalSeconds:3600,frame:i=>scalarGridPixels([i,i,i,i])});expect(pair.update('2026-09-16T00:30Z')).toBe(true);expect(pair.uniforms.weatherBlend.value).toBe(0);expect(pair.update('2026-09-16T01:00Z')).toBe(false);pair.dispose()})
