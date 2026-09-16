import type { AirContinent, AirContinentSource } from '@motionstudies/core/air-continents'
import type { AirEndpoint, AirSample } from '@motionstudies/core/domain/air'
export interface EndpointAirport { icao: string; iata: string; name: string; city: string; longitude: number; latitude: number; elevation: number; continent?: AirContinent; continentSource?: AirContinentSource }
export interface AirContinentOverride { airportIdent: string; continent: AirContinent; reason: string }
export function parseAirports(csv: string, options?: { continentOverrides?: readonly AirContinentOverride[] }): EndpointAirport[]
export function inferAirEndpoints(samples: readonly AirSample[], airports: readonly EndpointAirport[]): { origin?: AirEndpoint; destination?: AirEndpoint }
export function enrichAirEndpoints(options: { manifestPath: string; snapshotPaths?: string[]; heatmapDirectory: string; airportCsvPath: string; utcOffsetHours: number }): Promise<{ tracks: number; origins: number; destinations: number }>
