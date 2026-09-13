import { describe, expect, it } from 'vitest'
import { BufferAttribute, BufferGeometry } from 'three'
import { applyTrailFrame } from './trail-frame.ts'

function geometry() {
  const value = new BufferGeometry()
  value.setAttribute('position', new BufferAttribute(new Float32Array(12), 3))
  value.setAttribute('color', new BufferAttribute(new Float32Array(12), 3))
  return value
}
describe('asynchronous trail frame upload', () => {
  it('copies active vertices, bounds upload ranges, and clears an empty response', () => {
    const buffers = [geometry(), geometry(), geometry()]
    const positions = buffers.map(() => new Float32Array([1, 2, 3, 4, 5, 6]))
    applyTrailFrame(buffers, { positions, colors: positions, counts: [1, 1, 1] })
    expect(buffers[0].drawRange.count).toBe(2)
    expect(Array.from(buffers[0].getAttribute('position').array.slice(0, 6))).toEqual([1, 2, 3, 4, 5, 6])
    expect(buffers[0].getAttribute('position').updateRanges).toEqual([{ start: 0, count: 6 }])
    applyTrailFrame(buffers, { positions: [], colors: [], counts: [0, 0, 0] })
    expect(buffers.map(value => value.drawRange.count)).toEqual([0, 0, 0])
    buffers.forEach(value => value.dispose())
  })
  it('rejects a malformed response before any segment is modified', () => {
    const buffers = [geometry(), geometry(), geometry()]
    const positions = buffers.map(() => new Float32Array(6).fill(9))
    expect(() => applyTrailFrame(buffers, { positions, colors: positions, counts: [1, 3, 1] })).toThrow(RangeError)
    expect(Array.from(buffers[0].getAttribute('position').array)).toEqual(new Array(12).fill(0))
    expect(() => applyTrailFrame(buffers, { positions, colors: positions, counts: [1] })).toThrow(RangeError)
    buffers.forEach(value => value.dispose())
  })
})
