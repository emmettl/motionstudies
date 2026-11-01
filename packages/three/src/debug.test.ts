import { describe, expect, it } from 'vitest'
import { editionDebugOptions, startEditionDebug, registerDebugRenderer, debugRenderers } from './debug.ts'
import type { WebGLRenderer } from 'three'

describe('edition debugging opt-in', () => {
  it('ignores unrelated flags and requires perf opt-in for continuous rendering', () => {
    expect(editionDebugOptions('?debug=1&debugLoop=continuous')).toEqual({ perf: false, capture: false, continuous: false })
    expect(editionDebugOptions('?debug=capture&debugLoop=continuous')).toEqual({ perf: false, capture: true, continuous: false })
    expect(editionDebugOptions('?debug=perf,capture')).toEqual({ perf: true, capture: true, continuous: false })
    expect(editionDebugOptions('?debug=perf&debugLoop=continuous')).toEqual({ perf: true, capture: false, continuous: true })
  })
  it('does not load browser tools or retain renderers outside a debug document', async () => {
    expect(await startEditionDebug({ edition: 'fixture', build: 'test' })).toBeUndefined()
    const stop = registerDebugRenderer({} as WebGLRenderer, { label: 'fixture', redraw() {} })
    expect(debugRenderers.size).toBe(0)
    stop()
  })
})
