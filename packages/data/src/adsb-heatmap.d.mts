import type { AirSnapshot, AirTrack } from '@motionstudies/core/domain/air'
import type { AirDayManifest, AirDayChunk, AirDayChunkDescriptor } from '@motionstudies/core/domain/air-day'

export interface HeatmapWindow {
  serviceDate: string
  /** Explicit offset for this recording; the caller owns DST and source date selection. */
  utcOffsetHours: number
  windowStart: number
  windowEnd: number
  bounds?: readonly [west: number, south: number, east: number, north: number]
  /** Numeric 24-bit ICAO addresses; omit to decode all aircraft. */
  addresses?: ReadonlySet<number>
}
export type HeatmapSample = [time: number, longitude: number, latitude: number, altitudeFeet: number, speedKnots: number, callsign: string | undefined]
export interface HeatmapRecord {
  id: string
  callsign: string
  samples: readonly HeatmapSample[]
}
export interface HeatmapSource {
  name: string
  sha256: string
  sourceUrl: string
}
export type HeatmapMetadata = AirSnapshot['metadata'] & {
  timezone?: string
  utcOffsetHours: number
  sourceFiles: readonly HeatmapSource[]
}
export type HeatmapSnapshot = Omit<AirSnapshot, 'metadata'> & { readonly metadata: HeatmapMetadata }
export type AirChunkIntegrity = AirDayChunkDescriptor & { readonly bytes: number; readonly sha256: string }
export type ChunkedAirManifest = Omit<AirDayManifest, 'chunks'> & { readonly chunks: readonly AirChunkIntegrity[] }
export type HeatmapManifest = Omit<ChunkedAirManifest, 'metadata'> & { readonly metadata: HeatmapMetadata }

/** Uncompressed binary input; returns the number of accepted observations. Does not round coordinates. An absent callsign is undefined; an explicitly cleared one is empty. */
export function decodeAdsbHeatmap(bytes: Uint8Array, options: HeatmapWindow, onSample: (address: number, sample: HeatmapSample) => void): number
/** Does not mutate the input records. Legacy unsplit snapshots can opt out of flight segmentation. */
export function transportAirTracks(records: Iterable<HeatmapRecord>, options?: { splitTracks?: boolean }): AirTrack[]
export function chunkAirSnapshot(snapshot: AirSnapshot, options: {
  chunkSeconds: number
  stem: string
  overlapBefore?: number
  overlapAfter?: number
}): { manifest: ChunkedAirManifest; chunks: { descriptor: AirChunkIntegrity; payload: AirDayChunk }[] }
export interface HeatmapIngestOptions extends HeatmapWindow {
  inputs: readonly string[]
  output: string
  bounds: readonly [west: number, south: number, east: number, north: number]
  timezone?: string
  chunkHours?: number
  /** Defaults true; use false only to preserve a legacy single-track-per-aircraft snapshot. */
  splitTracks?: boolean
}
export function ingestAdsbHeatmaps(options: HeatmapIngestOptions & { chunkHours: number }): Promise<HeatmapManifest>
export function ingestAdsbHeatmaps(options: HeatmapIngestOptions & { chunkHours?: undefined }): Promise<HeatmapSnapshot>
export function ingestAdsbHeatmaps(options: HeatmapIngestOptions): Promise<HeatmapSnapshot | HeatmapManifest>
