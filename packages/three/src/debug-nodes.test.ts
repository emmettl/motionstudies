import { expect, it, vi } from 'vitest'
import { prepareNodeDebug } from './debug-nodes.ts'
import { createNodeDebug } from './debug-nodes-runtime.ts'
import type { WebGPURenderer } from 'three/webgpu'

it('leaves ordinary documents without node diagnostics or browser dependencies', async () => {
  expect(await prepareNodeDebug({ edition: 'test', build: 'test' })).toBeUndefined()
})

it('preserves application error hooks and restores them without retaining disposed renderers', async () => {
  const original = { node: vi.fn(), shader: vi.fn(), error: vi.fn(), lost: vi.fn() }
  const renderer = {
    backend: { isWebGPUBackend: true },
    debug: { onNodeBuilderCreated: original.node, onShaderError: original.shader },
    onError: original.error, onDeviceLost: original.lost,
  } as unknown as WebGPURenderer
  // No document/window/Spector is available in this test. Native capture mode
  // must still be able to observe a renderer without importing WebGL tooling.
  const debug = createNodeDebug({ edition: 'test', build: 'test' }, { capture: true, perf: false, continuous: false })
  await debug.observe(renderer)
  const builder = {} as Parameters<NonNullable<typeof renderer.debug.onNodeBuilderCreated>>[0]
  renderer.debug.onNodeBuilderCreated!(builder, 'fixture')
  renderer.onError('fixture error')
  const loss: Parameters<WebGPURenderer['onDeviceLost']>[0] = { api: 'WebGPU', message: 'fixture loss', reason: 'unknown', originalEvent: null }
  renderer.onDeviceLost(loss)
  expect(original.node).toHaveBeenCalledWith(builder, 'fixture')
  expect(original.error).toHaveBeenCalledWith('fixture error')
  expect(original.error.mock.contexts[0]).toBe(renderer)
  expect(original.lost).toHaveBeenCalledWith(loss)
  await expect(debug.observe(renderer)).rejects.toThrow('already observes')
  debug.dispose(); debug.dispose()
  expect(renderer.debug.onNodeBuilderCreated).toBe(original.node)
  expect(renderer.debug.onShaderError).toBe(original.shader)
  expect(renderer.onError).toBe(original.error)
  expect(renderer.onDeviceLost).toBe(original.lost)
  await expect(debug.observe(renderer)).rejects.toThrow('disposed')
})

it('does not overwrite an application callback installed after instrumentation', async () => {
  const renderer = { backend: {}, debug: { onNodeBuilderCreated: null, onShaderError: null }, onError() {}, onDeviceLost() {} } as unknown as WebGPURenderer
  const debug = createNodeDebug({ edition: 'test', build: 'test' }, { capture: false, perf: true, continuous: false })
  await debug.observe(renderer)
  const later = vi.fn(); renderer.onError = later
  debug.dispose()
  expect(renderer.onError).toBe(later)
  expect(renderer.debug.onNodeBuilderCreated).toBeNull()
  expect(renderer.debug.onShaderError).toBeNull()
})
