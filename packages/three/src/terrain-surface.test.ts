import { describe, expect, it } from 'vitest'
import { DataTexture } from 'three'
import { createTerrainGeometry, createHeightfieldSurface } from './terrain-surface.ts'

const grid = { rows: 2, columns: 3, widthMetres: 20, depthMetres: 10, elevations: [100, 100, 100, 100, 100, 100] }
describe('terrain surfaces', () => {
  it('preserves north-down layout, upward winding and explicit datum and units', () => {
    const mesh = createTerrainGeometry(grid, { metresPerUnit: 10, elevationDatum: 90, verticalExaggeration: 2 })
    const p = mesh.getAttribute('position'), n = mesh.getAttribute('normal')
    expect([p.getX(0), p.getY(0), p.getZ(0)]).toEqual([-1, 2, -.5])
    expect([p.getX(5), p.getY(5), p.getZ(5)]).toEqual([1, 2, .5])
    expect(n.getY(0)).toBe(1)
    expect(mesh.index!.count).toBe(12)
    mesh.dispose()
  })
  it('rejects corrupt grids and transforms before allocating surfaces', () => {
    expect(() => createTerrainGeometry({ ...grid, elevations: [1] })).toThrow()
    expect(() => createTerrainGeometry({ ...grid, elevations: [NaN, 1, 1, 1, 1, 1] })).toThrow()
    expect(() => createTerrainGeometry(grid, { metresPerUnit: 0 })).toThrow()
    expect(() => createTerrainGeometry({ ...grid, rows: 1 })).toThrow()
  })
  it('rejects node renderers from the object callback before a GLSL surface can draw', () => {
    const texture = new DataTexture(), surface = createHeightfieldSurface(grid, () => texture)
    const beforeRender = surface.mesh.onBeforeRender as (renderer: unknown) => void
    try {
      expect(() => beforeRender({ isWebGLRenderer: true })).not.toThrow()
      expect(() => beforeRender({ isWebGPURenderer: true, backend: { isWebGLBackend: true } })).toThrow('Heightfield surface requires Three WebGLRenderer')
    } finally { surface.dispose(); texture.dispose() }
  })
  it('rebinds ping-pong textures, supports packed channels and owns disposal', () => {
    let texture = new DataTexture()
    const surface = createHeightfieldSurface(grid, () => texture, { channel: 3, metresPerUnit: 10, rowOrder: 'south-to-north' })
    expect(surface.mesh.material.uniforms.uHeight.value).toBe(texture)
    expect(surface.mesh.material.uniforms.uHeightChannel.value.toArray()).toEqual([0, 0, 0, 1])
    expect(surface.mesh.geometry.getAttribute('position').getZ(0)).toBeCloseTo(-.5)
    expect(surface.mesh.material.uniforms.uSpacing.value.toArray()).toEqual([10, 10])
    expect(surface.mesh.material.uniforms.uRowDirection.value).toBe(-1)
    const old = texture
    texture = new DataTexture()
    surface.update()
    expect(surface.mesh.material.uniforms.uHeight.value).toBe(texture)
    let geometryDisposed = false, materialDisposed = false, textureDisposed = false
    surface.mesh.geometry.addEventListener('dispose', () => { geometryDisposed = true })
    surface.mesh.material.addEventListener('dispose', () => { materialDisposed = true })
    texture.addEventListener('dispose', () => { textureDisposed = true })
    surface.dispose()
    expect([geometryDisposed, materialDisposed, textureDisposed]).toEqual([true, true, false])
    old.dispose(); texture.dispose()
  })
})
