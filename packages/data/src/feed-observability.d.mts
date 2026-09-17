export type OperationalState = 'healthy' | 'degraded' | 'unknown' | 'waiting'
export type ConfiguredState = 'active' | 'paused' | 'setup-required'
export type FeedSchedule = { kind: 'interval'; seconds: number } | { kind: 'daily'; timeZone: string; deadline: string } | { kind: 'manual' | 'push' }
export interface FeedStage {
  id: string
  dependsOn: string[]
  maxAgeSeconds: number | null
  sourceMaxAgeSeconds?: number
}
export interface FeedDefinition {
  id: string
  label: string
  producerId: string
  producerFeed: string
  sourceId: string
  owner: string
  runbook: string
  state: ConfiguredState
  schedule: FeedSchedule
  stages: FeedStage[]
}
export interface FeedRegistry {
  schemaVersion: 1
  kind: 'feed-registry'
  id: string
  heartbeatMaxAgeSeconds: number
  clockSkewSeconds: number
  feeds: FeedDefinition[]
}
export interface FeedEvent {
  schemaVersion: 1
  kind: 'feed-event'
  eventId: string
  feedId: string
  stageId: string
  runId: string
  parentRunId?: string
  producerId: string
  revision: string
  occurredAt: string
  recordedAt: string
  type: 'started' | 'succeeded' | 'failed' | 'heartbeat'
  reasons: string[]
  metrics: Record<string, number>
}
export interface StageHealth {
  stageId: string
  state: OperationalState
  reasons: string[]
  timestamps: Partial<Record<'receivedAt' | 'sourceGeneratedAt' | 'latestPeriodEnd' | 'lastSuccessAt' | 'lastAttemptAt', string>>
  metrics: Record<string, number>
}
export interface FeedHealth {
  schemaVersion: 1
  kind: 'feed-health'
  registryId: string
  producerId: string
  observedAt: string
  producerGeneratedAt: string | null
  telemetry: { state: 'current' | 'stale' | 'missing' | 'invalid'; ageSeconds: number | null }
  feeds: { feedId: string; configuredState: ConfiguredState; state: OperationalState | Exclude<ConfiguredState, 'active'>; stages: StageHealth[] }[]
  capacity: { state: Exclude<OperationalState, 'waiting'>; reasons: string[]; metrics: Record<string, number> }
}
export function readOperationalTime(value: unknown): string
export function readFeedRegistry(value: unknown): FeedRegistry
export function readFeedEvent(value: unknown, registry: unknown): FeedEvent
export function readFeedHealth(value: unknown, registry: unknown): FeedHealth
export function summarizeFeedStages(stages: readonly Pick<StageHealth, 'state'>[]): OperationalState
