import { expect, it } from 'vitest'
import { createEndpointResolver, endpointCoverage, readAirEnrichment, usableEndpoint, type AirEnrichment } from './air-enrichment.ts'
import type { AirSearchTrack } from './air-search.ts'
const hash = 'a'.repeat(64)
const tracks: AirSearchTrack[] = ['known', 'supported', 'lookup', 'conflict', 'unknown'].map(id => ({ id, callsign: id, icaoAddress: id, start: 0, end: 100,
  origin: { icao: 'A', iata: 'AAA', city: 'A', name: 'A', time: 0, evidence: 'observed-endpoint' },
  ...(id === 'known' ? { destination: { icao: 'B', iata: 'BBB', city: 'B', name: 'B', time: 100, evidence: 'observed-endpoint' as const } } : {}) }))
const fixture = (): AirEnrichment => ({ kind: 'air-endpoint-enrichment', schemaVersion: 1, date: '2026-09-14', sourceManifestSha256: hash,
  airports: [{ icao: 'A', iata: 'AAA', name: 'A', continent: 'EU' }, { icao: 'B', iata: 'BBB', name: 'B', continent: 'NA' }],
  sources: [{ id: 'airports', kind: 'airport-reference', url: 'https://ourairports.com/data/', sha256: hash, license: 'public-domain' },
    { id: 'vrs', kind: 'route-reference', url: 'https://github.com/vradarserver/standing-data', sha256: hash, license: 'CC0' },
    { id: 'audit', kind: 'association-audit', url: 'reports/audit.json', sha256: hash, license: 'ODbL-1.0' }],
  proposals: [['supported', 'corroborated'], ['lookup', 'candidate'], ['conflict', 'conflicting']].map(([id, status]) => ({ trackId: id, callsign: id, aircraft: id,
    side: 'destination', airport: 'B', anchor: 'A', status: status as 'corroborated' | 'candidate' | 'conflicting', sourceIds: ['vrs', 'audit'], reasons: status === 'conflicting' ? ['ambiguous-airport-visit'] : [] })) })
const read = (value: unknown) => readAirEnrichment(value, { date: '2026-09-14', sourceManifestSha256: hash, tracks })
it('resolves metadata separately, gives observed endpoints precedence and preserves tracks', () => {
  const before = structuredClone(tracks), resolver = createEndpointResolver(read(fixture()))
  expect(resolver(tracks[0], 'destination')).toMatchObject({ status: 'observed', airport: { continent: 'NA' } })
  expect(resolver(tracks[1], 'destination')).toMatchObject({ status: 'corroborated', airport: { icao: 'B' } })
  expect(tracks).toEqual(before); expect(tracks[1].destination).toBeUndefined()
  const override = { ...tracks[0], destination: { ...tracks[0].destination!, continent: 'AS' as const } }
  expect(resolver(override, 'destination').airport?.continent).toBe('AS')
})
it('counts mutually exclusive evidence and opts into candidates without accepting conflicts', () => {
  const resolver = createEndpointResolver(read(fixture()))
  expect(endpointCoverage(tracks, resolver, 'destination')).toEqual({ segments: 5, observed: 1, corroborated: 1, candidate: 1, conflicting: 1, unknown: 1, usable: 2, unresolved: 3, continentKnown: 2 })
  expect(endpointCoverage(tracks, resolver, 'destination', true).usable).toBe(3)
  expect(usableEndpoint(resolver(tracks[3], 'destination'), true)).toBe(false)
})
it('rejects stale binding, duplicate proposals, unknown identities and observed overwrites', () => {
  for (const mutate of [
    (v: AirEnrichment) => { v.date = '2026-09-15' },
    (v: AirEnrichment) => { v.sourceManifestSha256 = 'b'.repeat(64) },
    (v: AirEnrichment) => { v.proposals.push(v.proposals[0]) },
    (v: AirEnrichment) => { v.proposals[0].callsign = 'different' },
    (v: AirEnrichment) => { v.proposals[0].anchor = 'different' },
    (v: AirEnrichment) => { Object.assign(v.proposals[0], { trackId: 'known', callsign: 'known', aircraft: 'known' }) },
  ]) { const v = fixture(); mutate(v); expect(() => read(v)).toThrow(/enrichment/) }
})
it('rejects unsupported evidence, unsafe links and unsupported corroboration', () => {
  const v = fixture(); v.sources[2].url = 'javascript:alert(1)'; expect(() => read(v)).toThrow()
  const w = fixture(); w.proposals[0].sourceIds = ['vrs']; expect(() => read(w)).toThrow()
  expect(() => read({ ...fixture(), proposals: [{ ...fixture().proposals[0], status: 'confirmed' }] })).toThrow()
  const x = fixture(); x.proposals[0].reasons = ['conflicting']; expect(() => read(x)).toThrow()
})
