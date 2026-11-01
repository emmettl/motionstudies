import { act, Component, type ReactNode } from 'react'
import { advance, createRoot, type RootState } from '@react-three/fiber'
import { expect, it, vi } from 'vitest'
import type { WebGLRenderer } from 'three'
import { useCameraFrame } from './use-camera-frame.ts'
import { useRequireWebGL, useWebGLStudyFrame } from './webgl-study.ts'

it('runs camera updates before default label/pick callbacks through the real Fiber scheduler', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const canvas = {} as HTMLCanvasElement
  const renderer = { isWebGLRenderer: true, render: vi.fn(), setPixelRatio() {}, setSize() {}, xr: {} } as unknown as WebGLRenderer
  const calls: string[] = []
  let generation = 0, state: RootState | undefined
  function Probe() {
    // Register the consumer first, so registration order cannot make this pass.
    useWebGLStudyFrame(() => { calls.push(`pick:${generation}`) })
    useCameraFrame(() => { calls.push(`camera:${++generation}`) })
    useRequireWebGL('Ordering probe')
    return null
  }
  const root = createRoot(canvas)
  try {
    await root.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 }, onCreated: next => { state = next } })
    await act(async () => { root.render(<Probe />) })
    expect(state).toBeDefined()
    advance(1, true, state); advance(2, true, state)
    expect(calls).toEqual(['camera:1', 'pick:1', 'camera:2', 'pick:2'])
  } finally {
    await act(async () => { root.unmount() })
    vi.unstubAllGlobals()
  }
})

it('rejects a node renderer supplied by an edition Canvas before its GLSL layer subscribes', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const canvas = {} as HTMLCanvasElement
  const renderer = { isWebGPURenderer: true, backend: { isWebGLBackend: true }, render() {}, setPixelRatio() {}, setSize() {}, xr: {} } as unknown as WebGLRenderer
  const errors: Error[] = [], frame = vi.fn(), consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false }
    static getDerivedStateFromError() { return { failed: true } }
    componentDidCatch(error: Error) { errors.push(error) }
    render() { return this.state.failed ? null : this.props.children }
  }
  function EditionLayer() {
    useRequireWebGL('Edition motion layer')
    useWebGLStudyFrame(frame)
    return null
  }
  const root = createRoot(canvas)
  try {
    await root.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 100, height: 100, top: 0, left: 0 } })
    await act(async () => { root.render(<Boundary><EditionLayer /></Boundary>) })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Edition motion layer requires Three WebGLRenderer')
    expect(frame).not.toHaveBeenCalled()
  } finally {
    await act(async () => { root.unmount() })
    consoleError.mockRestore(); vi.unstubAllGlobals()
  }
})
