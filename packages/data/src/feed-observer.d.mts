import type { SERVICE_TIMEZONE } from './uk-service-day.mjs'
import type { FeedHealth, StageHealth } from './feed-observability.mjs'
import type { DailyExpectation } from './feed-expectations.mjs'
export interface ObserverConfig {
  schemaVersion: 1
  kind: 'feed-observer-config'
  producerId: string
  healthUrl: string
  consumers: { feedId: string; manifestUrl: string; operator: string; deadline: string; timeZone: typeof SERVICE_TIMEZONE }[]
}
export interface ObserverCheck {
  schemaVersion: 1
  kind: 'feed-observer-check'
  startedAt: string
  completedAt: string
  sourceError: string | null
  requests: number
  bytes: number
  report: FeedHealth
  consumers: (StageHealth & { feedId: string; expectation: DailyExpectation })[]
}
export declare const OBSERVER_LIMITS: Readonly<{ requests: number; totalBytes: number; timeoutMs: number; totalMs: number; healthBytes: number; manifestBytes: number; releaseBytes: number }>
export function observeFeeds(registry: unknown, config: unknown, options?: {
  fetchImpl?: typeof fetch
  clock?: () => number
  tokens?: { health?: string; consumers?: Record<string, string> }
  limits?: typeof OBSERVER_LIMITS
}): Promise<ObserverCheck>
export function assessObserverCheck(registry: unknown, checked: ObserverCheck | null | undefined, options?: { now?: number; maxAgeSeconds?: number }): { state: 'healthy' | 'degraded' | 'unknown'; reasons: string[] }
