import { afterEach, expect, it, vi } from 'vitest'
import { observeLayout } from './observe-layout.ts'

afterEach(() => vi.unstubAllGlobals())

it('measures synchronously, batches resize bursts and cancels pending work on disposal', () => {
  let resize!: () => void
  const frames: FrameRequestCallback[] = []
  const observe = vi.fn(), disconnect = vi.fn(), cancel = vi.fn(), measure = vi.fn()
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback }
    observe = observe
    disconnect = disconnect
  })
  // Zero is a valid frame ID and must still count as a pending request.
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback) - 1)
  vi.stubGlobal('cancelAnimationFrame', cancel)
  const elements = [{} as Element, {} as Element]
  const dispose = observeLayout(elements, measure)
  expect(observe.mock.calls.flat()).toEqual(elements)
  expect(measure).toHaveBeenCalledTimes(1)
  resize(); resize()
  expect(frames).toHaveLength(1)
  expect(measure).toHaveBeenCalledTimes(1)
  frames[0](0)
  expect(measure).toHaveBeenCalledTimes(2)
  resize()
  dispose()
  expect(cancel).toHaveBeenCalledWith(1)
  expect(disconnect).toHaveBeenCalledOnce()
  frames[1](0); resize()
  expect(measure).toHaveBeenCalledTimes(2)
  expect(frames).toHaveLength(2)
})

it('still measures when ResizeObserver is unavailable', () => {
  vi.stubGlobal('ResizeObserver', undefined)
  const measure = vi.fn()
  const dispose = observeLayout([], measure)
  expect(measure).toHaveBeenCalledOnce()
  expect(dispose).not.toThrow()
})

it('disconnects if initial measurement throws', () => {
  const disconnect = vi.fn()
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnect })
  expect(() => observeLayout([{} as Element], () => { throw new Error('measurement failed') })).toThrow('measurement failed')
  expect(disconnect).toHaveBeenCalledOnce()
})
