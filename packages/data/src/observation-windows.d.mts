export interface ObservationRecord<T> {
  readonly id: string
  readonly timeUtc: string
  readonly receivedAt?: string
  readonly sourceRecordedAt?: string
  readonly sourceRefs?: readonly string[]
  readonly value: T
}
export interface ObservationWindowOptions {
  readonly startUtc: string
  readonly endUtc: string
  readonly sourceId: string
  readonly evidenceKind: string
  readonly timeBasis: 'capture-schedule' | 'receipt' | 'measurement'
  readonly windowSeconds?: number
  readonly cadenceSeconds?: number
  readonly minimumRecords?: number
  readonly duplicatePolicy?: 'reject' | 'omit' | 'last'
  readonly pathPrefix?: string
  readonly maxRecords?: number
  readonly maxBytes?: number
}
export interface ObservationCoverage {
  inputCount: number; retainedRecords: number; duplicates: number; conflicts: number; outsideWindow: number;
  occupiedSlots: number; expectedSlots: number; missingSlots: number[]; longestGapSeconds: number;
  leadingGapSeconds: number; trailingGapSeconds: number;
}
export interface ObservationWindowDescriptor {
  id: string; windowStart: number; windowEnd: number; path: string; frameCount: number; bytes: number; sha256: string;
}
export function jsonArtifact(value: unknown): { json: string; bytes: number; sha256: string }
export function compileObservationWindows<T>(input: Iterable<ObservationRecord<T>>, options: ObservationWindowOptions): {
  manifest: { schemaVersion: number; sourceId: string; evidenceKind: string; timeBasis: ObservationWindowOptions['timeBasis'];
    startUtc: string; endUtc: string; durationSeconds: number; cadenceSeconds: number; duplicatePolicy: string;
    coverage: ObservationCoverage; chunks: ObservationWindowDescriptor[] };
  chunks: { descriptor: ObservationWindowDescriptor; artifact: { windowStart: number; windowEnd: number;
    frames: (ObservationRecord<T> & { time: number })[] }; json: string }[];
}
