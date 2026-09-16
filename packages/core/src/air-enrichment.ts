import { isAirContinent, type AirContinent } from './air-continents.ts'
import type { AirSearchTrack } from './air-search.ts'

export type EndpointSide = 'origin' | 'destination'
export type EndpointEvidence = 'observed' | 'corroborated' | 'candidate' | 'conflicting' | 'unknown'
export interface EnrichmentAirport { icao: string; iata: string; name: string; continent: AirContinent | null }
export interface EnrichmentSource { id: string; kind: 'airport-reference' | 'route-reference' | 'association-audit'; url: string; sha256: string; license: string }
export interface EndpointProposal {
  trackId: string; callsign: string; aircraft: string; side: EndpointSide; airport: string; anchor: string
  status: 'corroborated' | 'candidate' | 'conflicting'; sourceIds: string[]; reasons: string[]
}
/** Sidecar metadata only. Proposed endpoints deliberately have no playback or event time. */
export interface AirEnrichment {
  kind: 'air-endpoint-enrichment'; schemaVersion: 1; date: string; sourceManifestSha256: string
  airports: EnrichmentAirport[]; sources: EnrichmentSource[]; proposals: EndpointProposal[]
}
export interface EndpointLabel { status: EndpointEvidence; airport?: EnrichmentAirport; sourceIds: readonly string[]; reasons: readonly string[] }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const hash = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v)
const side = (v: unknown): v is EndpointSide => v === 'origin' || v === 'destination'

/** Reject wrong-day, foreign-track, duplicate, stale-anchor and observed-overwrite metadata. */
export function readAirEnrichment(value: unknown, binding: { date: string; sourceManifestSha256: string; tracks: readonly AirSearchTrack[] }): AirEnrichment {
  const fail = (): never => { throw Error('Invalid or mismatched endpoint enrichment') }
  if (!object(value) || value.kind !== 'air-endpoint-enrichment' || value.schemaVersion !== 1 || value.date !== binding.date
    || !hash(value.sourceManifestSha256) || value.sourceManifestSha256 !== binding.sourceManifestSha256
    || !Array.isArray(value.airports) || !Array.isArray(value.sources) || !Array.isArray(value.proposals)) return fail()
  const airports = new Set<string>(), sources = new Map<string, string>(), proposals = new Set<string>()
  for (const a of value.airports) {
    if (!object(a) || !text(a.icao) || typeof a.iata !== 'string' || !text(a.name) || (a.continent !== null && !isAirContinent(a.continent)) || airports.has(a.icao)) return fail()
    airports.add(a.icao)
  }
  for (const s of value.sources) {
    if (!object(s) || !text(s.id) || sources.has(s.id) || !text(s.url) || !hash(s.sha256) || !text(s.license)
      || !['airport-reference', 'route-reference', 'association-audit'].includes(String(s.kind))) return fail()
    // Links are either public HTTPS sources or simple sibling report files.
    if (!/^https:\/\/[^\s]+$/.test(s.url) && !/^reports\/[a-zA-Z0-9._-]+\.json$/.test(s.url)) return fail()
    sources.set(s.id, String(s.kind))
  }
  const tracks = new Map(binding.tracks.map(t => [t.id, t]))
  for (const p of value.proposals) {
    if (!object(p) || !text(p.trackId) || !side(p.side) || !text(p.airport) || !airports.has(p.airport)
      || !['corroborated', 'candidate', 'conflicting'].includes(String(p.status)) || !Array.isArray(p.sourceIds) || !p.sourceIds.length
      || !p.sourceIds.every(s => typeof s === 'string' && sources.has(s)) || !Array.isArray(p.reasons) || !p.reasons.every(text)) return fail()
    const t = tracks.get(p.trackId), key = `${p.trackId}:${p.side}`, opposite = p.side === 'origin' ? 'destination' : 'origin'
    if (!t || t[p.side] || t[opposite]?.icao !== p.anchor || t.callsign !== p.callsign || t.icaoAddress !== p.aircraft || proposals.has(key)) return fail()
    if (!p.sourceIds.some(s => sources.get(s) === 'route-reference')
      || (p.status !== 'candidate' && !p.sourceIds.some(s => sources.get(s) === 'association-audit'))
      || (p.status === 'corroborated' && p.reasons.length)) return fail()
    proposals.add(key)
  }
  return value as unknown as AirEnrichment
}

export function createEndpointResolver(enrichment: AirEnrichment) {
  const airports = new Map(enrichment.airports.map(a => [a.icao, a]))
  const proposals = new Map(enrichment.proposals.map(p => [`${p.trackId}:${p.side}`, p]))
  const referenceIds = enrichment.sources.filter(s => s.kind === 'airport-reference').map(s => s.id)
  return (track: AirSearchTrack, side: EndpointSide): EndpointLabel => {
    const observed = track[side]
    if (observed) return { status: 'observed', airport: airports.get(observed.icao) ?? { icao: observed.icao, iata: observed.iata, name: observed.name,
      continent: isAirContinent(observed.continent) ? observed.continent : null }, sourceIds: referenceIds, reasons: [] }
    const p = proposals.get(`${track.id}:${side}`)
    if (!p) return { status: 'unknown', sourceIds: [], reasons: [] }
    return { status: p.status, airport: airports.get(p.airport), sourceIds: p.sourceIds, reasons: p.reasons }
  }
}
export function usableEndpoint(label: EndpointLabel, includeCandidates = false) {
  return label.status === 'observed' || label.status === 'corroborated' || (includeCandidates && label.status === 'candidate')
}
export function endpointCoverage(tracks: readonly AirSearchTrack[], resolve: ReturnType<typeof createEndpointResolver>, side: EndpointSide, includeCandidates = false) {
  const counts = { observed: 0, corroborated: 0, candidate: 0, conflicting: 0, unknown: 0 }
  let usable = 0, continentKnown = 0
  for (const t of tracks) { const label = resolve(t, side); counts[label.status]++; if (usableEndpoint(label, includeCandidates)) { usable++; if (label.airport?.continent) continentKnown++ } }
  return { segments: tracks.length, ...counts, usable, unresolved: tracks.length - usable, continentKnown }
}
