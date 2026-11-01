import { expect, test } from 'vitest'
import { frameElapsed, frameRenderer, requireWebGLRenderer } from './frame-state.ts'

test('elapsed reads preserve the shared v9 clock origin without advancing it',()=>{
  const clock={elapsedTime:124,getDelta(){throw Error('Clock advanced')},getElapsedTime(){throw Error('Clock advanced')}}
  expect(frameElapsed({clock})).toBe(124);expect(frameElapsed({clock})).toBe(124)
  clock.elapsedTime=130;expect(frameElapsed({clock})).toBe(130)
})

test('GLSL guard accepts WebGLRenderer and rejects node renderers even with a WebGL backend', () => {
  expect(() => requireWebGLRenderer({ isWebGLRenderer: true })).not.toThrow()
  for (const renderer of [undefined, {}, { isWebGPURenderer: true, backend: { isWebGLBackend: true } }]) {
    expect(() => requireWebGLRenderer(renderer, 'Test motion layer')).toThrow('Test motion layer requires Three WebGLRenderer')
  }
})
test('modern elapsed values, including zero, take precedence over the legacy clock',()=>{
  expect(frameElapsed({elapsed:0,clock:{elapsedTime:124}})).toBe(0)
  expect(frameElapsed({elapsed:12.5})).toBe(12.5)
})
test('missing and invalid time is rejected rather than inventing a clock',()=>{
  for(const state of [{},{elapsed:NaN},{elapsed:Infinity},{clock:{elapsedTime:NaN}}])expect(()=>frameElapsed(state)).toThrow('finite elapsed time')
})
test('renderer access preserves identity and prefers the modern key when available',()=>{
  const legacy={id:'legacy'},modern={id:'modern'}
  expect(frameRenderer({gl:legacy})).toBe(legacy)
  expect(frameRenderer({renderer:modern,gl:legacy})).toBe(modern)
  expect(frameRenderer({renderer:null,gl:legacy})).toBe(legacy)
  expect(()=>frameRenderer({})).toThrow('no renderer')
})
