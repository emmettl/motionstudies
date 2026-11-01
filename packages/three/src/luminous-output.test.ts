import { expect, test } from 'vitest'
import { ACESFilmicToneMapping, Color, LinearSRGBColorSpace, Scene, OrthographicCamera, SRGBColorSpace } from 'three'
import type { WebGPURenderer } from 'three/webgpu'
import { createLuminousOutput } from './luminous-output.ts'

test('display composition restores renderer state and its binding even when drawing fails', () => {
  const clear = new Color('#080d10'), original = clear.clone(), binding = createLuminousOutput()
  const state = { colourSpace: SRGBColorSpace, toneMapping: ACESFilmicToneMapping, target: null as unknown, alpha: .7 }
  const renderer = {
    isWebGPURenderer: true,
    get outputColorSpace() { return state.colourSpace }, set outputColorSpace(value) { state.colourSpace=value },
    get toneMapping() { return state.toneMapping }, set toneMapping(value) { state.toneMapping=value },
    getClearColor(target:Color) { return target.copy(clear) }, getClearAlpha() { return state.alpha },
    setClearColor(value:Color,alpha:number) { clear.copy(value);state.alpha=alpha },
    getRenderTarget() { return state.target },setRenderTarget(target:unknown) { state.target=target },
    render() { expect(state.colourSpace).toBe(LinearSRGBColorSpace);expect(binding.encoding.value).toBe(1);throw Error('Injected draw failure') },
  } as unknown as WebGPURenderer
  expect(()=>binding.render(renderer,new Scene(),new OrthographicCamera())).toThrow('Injected draw failure')
  expect(state).toEqual({colourSpace:SRGBColorSpace,toneMapping:ACESFilmicToneMapping,target:null,alpha:.7})
  expect(clear.equals(original)).toBe(true);expect(binding.encoding.value).toBe(0)
})

test('a scene background is rejected before changing renderer settings',()=>{
  const scene=new Scene();scene.background=new Color('red')
  expect(()=>createLuminousOutput().render({} as WebGPURenderer,scene,new OrthographicCamera())).toThrow('clear-colour background')
})
