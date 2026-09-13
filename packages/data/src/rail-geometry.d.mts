import type {RailCoordinate, RailOsm} from './rail-routing.mjs'
export type RailStop = [number, number, string, string, string]
export interface CorridorGeometry { stops: RailStop[]; paths: RailCoordinate[][]; wayIds?: number[]; pairPaths?: Record<string, RailCoordinate[]>; corridorPaths?: RailCoordinate[][] }
export interface CorridorJourney { id: string; direction: 'inbound' | 'outbound'; stops: [number, number, number][] }
export function distance(a: RailCoordinate, b: RailCoordinate): number
export function railCorridorGeometry(osm: RailOsm, stationCodes: string[]): CorridorGeometry & {wayIds: number[]}
export function assembleRailCorridor<T extends CorridorJourney, M extends {coverage?: Record<string, unknown>}, B> (input: {journeys: T[]; geometry: CorridorGeometry; metadata: M; bounds: B; excluded?: unknown[]}): {metadata: M & {coverage: {includedJourneys: number; excluded: unknown[]}}; bounds: B; stops: RailStop[]; paths: RailCoordinate[][]; edges: never[]; trains: (T & {start: number; end: number; pathSegments: number[]})[]; corridorPaths: RailCoordinate[][]; fadeKilometres: number}
