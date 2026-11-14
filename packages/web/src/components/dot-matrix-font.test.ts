import { describe, expect, it } from 'vitest'
import { matrixGlyph, matrixPath } from './dot-matrix-font.ts'

describe('dot-matrix font', () => {
  it('draws Swiss place names without the text fallback', () => {
    for (const name of ['Zürich, Bürkliplatz', 'Hölderlinstrasse', 'Ägerten', 'Genève, Cornavin', 'Neuchâtel', 'Fribourg/Freiburg', '♿ 3\''])
      expect(matrixPath(name), name).toBeTypeOf('string')
  })

  it('keeps every glyph inside the 5 × 7 cell', () => {
    for (const character of 'aäöüÄÖÜéèêàâçôîÉ,♿Z9') {
      const glyph = matrixGlyph(character)!
      expect(glyph, character).toHaveLength(7)
      for (const row of glyph) expect(row >= 0 && row < 32, character).toBe(true)
    }
  })

  it('gives umlauts the base letter plus two dots on the top row', () => {
    expect(matrixGlyph('ü')!.slice(2)).toEqual(matrixGlyph('u')!.slice(2))
    expect(matrixGlyph('ä')!.slice(2)).toEqual(matrixGlyph('a')!.slice(2))
    expect(matrixGlyph('ü')![0]).toBe(0b01010)
  })

  it('leaves unsupported characters undefined', () => {
    expect(matrixGlyph('ß')).toBeUndefined()
    expect(matrixPath('東京')).toBeUndefined()
  })
})
