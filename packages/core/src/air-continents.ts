/** Geographic continents from the airport reference; EU is not European Union membership. */
export const AIR_CONTINENTS = {
  AF: 'Africa', AN: 'Antarctica', AS: 'Asia', EU: 'Europe',
  NA: 'North America', OC: 'Oceania', SA: 'South America',
} as const

export type AirContinent = keyof typeof AIR_CONTINENTS
export type AirContinentSource = 'ourairports' | 'override'
export type AirContinentStatus = 'known' | 'unknown-endpoint' | 'unknown-continent'
export interface AirContinentLabel {
  readonly continent: AirContinent | null
  readonly status: AirContinentStatus
}

export function isAirContinent(value: unknown): value is AirContinent {
  return typeof value === 'string' && Object.hasOwn(AIR_CONTINENTS, value)
}

/** Older releases and unobserved endpoints remain explicitly unknown. */
export function classifyAirEndpoint(endpoint?: { readonly continent?: unknown } | null): AirContinentLabel {
  if (!endpoint) return { continent: null, status: 'unknown-endpoint' }
  if (!isAirContinent(endpoint.continent)) return { continent: null, status: 'unknown-continent' }
  return { continent: endpoint.continent, status: 'known' }
}

/** Pass the canonical track index, never overlapping playback chunks. Counts are track segments, not flights. */
export function summarizeAirContinents(tracks: Iterable<{
  readonly origin?: { readonly continent?: unknown }
  readonly destination?: { readonly continent?: unknown }
}>) {
  const empty = () => ({
    known: 0, unknownEndpoint: 0, unknownContinent: 0,
    continents: { AF: 0, AN: 0, AS: 0, EU: 0, NA: 0, OC: 0, SA: 0 },
  })
  const counts = { origin: empty(), destination: empty() }
  let trackSegments = 0
  for (const track of tracks) {
    trackSegments++
    for (const side of ['origin', 'destination'] as const) {
      const label = classifyAirEndpoint(track[side]), count = counts[side]
      if (label.continent) { count.known++; count.continents[label.continent]++ }
      else if (label.status === 'unknown-endpoint') count.unknownEndpoint++
      else count.unknownContinent++
    }
  }
  const coverage = (side: 'origin' | 'destination') => ({
    ...counts[side], knownFraction: trackSegments ? counts[side].known / trackSegments : null,
  })
  return { trackSegments, origin: coverage('origin'), destination: coverage('destination') }
}
