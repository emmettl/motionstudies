import type {PublicCallRecord} from './rail-journeys.mjs'
export interface PublicTimetablePage { page: number; rows: [number, [number, number, string][]][]; text: string }
export function publicTimetablePages(bytes: Uint8Array): PublicTimetablePage[]
export function publicTimetableColumns(pages: PublicTimetablePage[], options: {table: string; target: string; operator: string; acceptPage: (page: PublicTimetablePage) => boolean; resolveCode: (name: string) => string | null | undefined}): PublicCallRecord[]
