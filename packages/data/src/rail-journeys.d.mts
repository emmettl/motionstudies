import type { WttGrid } from './rail-wtt.mjs'
export interface RailStation { id?: number; lon: number; lat: number; tags: Record<string, string> }
export interface RailSource { table: string; sheet?: string; column?: number; days?: string; dates?: string; page?: number; sha256?: string; url?: string }
export interface RailPoint { code: string; arrival: number; departure: number; passenger: boolean; pickupOnly: boolean; setDownOnly: boolean; block?: number; rows: number[]; source: number; arr?: number; dep?: number; pass?: number; publicSupplement?: RailSource }
export interface RailJourney { uid: string; tid: string; operator: string; origin: string; destination: string; originDate: string; points: RailPoint[]; sources: RailSource[] }
export interface RailConflict { id: string; point: RailPoint; previous: RailPoint | null; sources: RailSource[] }
export interface JoinedRailJourneys { journeys: RailJourney[]; stations: Record<string, RailStation>; sources: RailSource[]; unmapped: Record<string, number>; conflicts: RailConflict[]; columnCounts: Record<string, number> }
export interface JoinWttOptions { serviceDate: string; stations: Record<string, RailStation>; operators: string[]; resolveLocation: (name: string, operator: string, context?: {header: boolean}) => string | null | undefined; normalizeName: (name: string) => string; includeTrain?: (tid: string) => boolean }
export function joinWttColumns(tables: {table: string; sha256: string; sheets: WttGrid}[], options: JoinWttOptions): JoinedRailJourneys
export interface PublicCall { code: string; time: number; kind: 'arrival' | 'departure' }
export interface PublicCallRecord extends PublicCall { operator: string; anchors: PublicCall[]; table: string; page: number; column: number }
export interface PublicCallAudit { added: {uid: string; originDate: string; code: string; time: number; table: string; page: number; column: number}[]; unmatched: Pick<PublicCallRecord, 'code' | 'time' | 'table' | 'page' | 'column'>[]; ambiguous: {record: PublicCallRecord; uids: string[]}[]; sourceColumns: number }
/** Mutates the supplied journeys. Callers must reject ambiguous/unreviewed unmatched records before emitting output. */
export function supplementPublicCalls(result: Pick<JoinedRailJourneys, 'journeys'>, records: PublicCallRecord[]): PublicCallAudit
