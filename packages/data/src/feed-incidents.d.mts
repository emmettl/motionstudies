import type { FeedHealth, OperationalState } from './feed-observability.mjs'
export interface IncidentPolicy { openAfterSeconds: number; recoverAfterSeconds: number; retentionDays: number; maxEvents: number }
export declare const INCIDENT_POLICY: Readonly<IncidentPolicy>
export interface IncidentEvent {
  id: string
  incidentId: string
  key: string
  feedId: string | null
  stageId: string
  firstDetectedAt: string
  at: string
  transition: 'opened' | 'updated' | 'recovered'
  state: OperationalState
  reasons: string[]
}
export interface ActiveIncident {
  incidentId: string
  key: string
  feedId: string | null
  stageId: string
  firstDetectedAt: string
  openedAt: string
  lastObservedAt: string
  state: OperationalState
  reasons: string[]
  recoveryStartedAt?: string
  recoveryProducerAt?: string
}
export interface IncidentState {
  schemaVersion: 1
  kind: 'feed-incident-state'
  registryId: string
  producerId: string
  policy: IncidentPolicy
  lastObservedAt: string
  lastReportId: string
  report: FeedHealth
  active: Record<string, ActiveIncident>
  pending: Record<string, { since: string }>
  events: IncidentEvent[]
  prunedEvents: number
}
export function readIncidentStore(root: string): Promise<IncidentState>
export function updateIncidentStore(root: string, registry: unknown, report: unknown, options?: { policy?: Partial<IncidentPolicy>; now?: number }): Promise<{ state: IncidentState; changed: boolean; events: IncidentEvent[] }>
