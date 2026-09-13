import type {RailStation, JoinedRailJourneys} from './rail-journeys.mjs'
export type RailCoordinate = [number, number]
export interface RailOsmNode { type: 'node'; id: number; lon: number; lat: number; tags?: Record<string, string> }
export interface RailOsmWay { type: 'way'; id: number; nodes: number[]; tags?: Record<string, string> }
export interface RailOsm { elements: (RailOsmNode | RailOsmWay | {type: 'relation'; id: number})[] }
export interface RailRoutingOptions { project: (point: RailCoordinate) => RailCoordinate; measure?: (a: RailCoordinate, b: RailCoordinate) => number; includeWay?: (way: RailOsmWay, nodes: (RailOsmNode | undefined)[]) => boolean; anchorRadius?: (code: string) => number }
export class RailwayGraph {
 constructor(osm: RailOsm, stations: Record<string, RailStation>, options: RailRoutingOptions)
 stationCandidates(code: string): [number, number][]
 distance(a: RailCoordinate, b: RailCoordinate): number
 route(a: string, b: string): [RailCoordinate[], number[], number]
}
export function railBoundaryDistance(point: RailCoordinate, rings: RailCoordinate[][], project: RailRoutingOptions['project']): number
export type RailBoundary = {type: 'Polygon'; coordinates: RailCoordinate[][]} | {type: 'MultiPolygon'; coordinates: RailCoordinate[][][]}
export interface RoutedRailJourneys extends JoinedRailJourneys { geometry: Record<string, {path: RailCoordinate[]; ways: number[]; length: number}>; stationBoundaryDistances: Record<string, number>; geometryFailures: Record<string, string>; excludedGeometry: {uid: string; originDate: string; operator: string; missing: string[]}[] }
export function routeRailJourneys(result: JoinedRailJourneys, osm: RailOsm, options: RailRoutingOptions & {boundary: RailBoundary; routeMargin?: number; visibleMargin?: number}): RoutedRailJourneys
