import { describe, expect, it } from 'vitest'
import { AIR_CONTINENTS, classifyAirEndpoint, isAirContinent, summarizeAirContinents } from './air-continents.ts'

describe('air continent labels', () => {
  it('recognizes all seven geographical continents, including North America', () => {
    for (const continent of Object.keys(AIR_CONTINENTS)) {
      expect(classifyAirEndpoint({ continent })).toEqual({ continent, status: 'known' })
    }
    expect(isAirContinent('toString')).toBe(false)
  })
  it('distinguishes missing endpoints from missing or invalid reference labels', () => {
    expect(classifyAirEndpoint()).toEqual({ continent: null, status: 'unknown-endpoint' })
    for (const continent of [undefined, null, '', 'ZZ', 'Europe', 'toString']) {
      expect(classifyAirEndpoint({ continent })).toEqual({ continent: null, status: 'unknown-continent' })
    }
  })
  it('counts canonical track segments and includes unknowns in coverage', () => {
    const summary = summarizeAirContinents([
      { origin: { continent: 'NA' }, destination: { continent: 'EU' } },
      { destination: { continent: 'AS' } },
      { origin: {} },
    ])
    expect(summary.trackSegments).toBe(3)
    expect(summary.origin).toMatchObject({ known: 1, unknownEndpoint: 1, unknownContinent: 1, knownFraction: 1 / 3 })
    expect(summary.destination).toMatchObject({ known: 2, unknownEndpoint: 1, unknownContinent: 0, knownFraction: 2 / 3 })
    expect(summary.origin.continents.NA).toBe(1)
    expect(summary.origin.continents.SA).toBe(0)
    expect(summarizeAirContinents([]).origin.knownFraction).toBeNull()
  })
})
