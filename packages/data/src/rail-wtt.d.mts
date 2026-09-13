export type WttGrid = Record<string, string[][]>
export interface WttEvent { location: string; kind: 'arr' | 'dep' | 'pass'; sourceTime: string; wallSecondsFromBankMidnight: number; symbols: string; row: number }
export interface WttIdentity { table: string; sheet: string; column: number; uid: string }
export interface WttColumn extends WttIdentity { tid: string; operator: string; origin: string; destination: string; datesOfOperation: string; runningDays: string; serviceCode: string; events: WttEvent[] }
export interface WttRejection extends WttIdentity { reason: string }
export function listRailArchive(archive: string): Promise<string[]>
export function readRailArchiveEntry(archive: string, member: string, maxBytes?: number): Promise<Uint8Array>
export function readWtt(input: string | Uint8Array, options?: { weekends?: boolean; maxWorkbookBytes?: number; maxExpandedBytes?: number; maxCells?: number }): Promise<WttGrid>
export function wttTiming(value: string): [number, string]
export function wttRunsOn(code: string, dateRange: string, date: string): boolean
export function wttTerminal(value: string): [string, number]
export function auditWttGrid(sheets: WttGrid, table: string, serviceDate: string, options?: { includeColumn?: (column: WttColumn) => boolean }): { columns: WttColumn[]; rejected: WttRejection[] }
