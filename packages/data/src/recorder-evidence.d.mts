import type { FeedHealth } from './feed-observability.mjs'
export interface RecorderEvidencePlan {
  schemaVersion: 1
  kind: 'recorder-evidence-plan'
  producerId: string
  validUntil: string
  feeds: {
    feedId: string
    archive?: { journalPath: string; closeoutPath: string; expectedEnd: string; deadlineAt: string }
    publication?: { pointerPath: string; operator: string; expectedThrough: string; deadlineAt: string }
  }[]
}
/** Reads explicitly selected local files, with integrity checks and a 64 MiB total read budget. */
export function recorderEvidenceHealth(registry: unknown, report: unknown, plan: unknown): Promise<FeedHealth>
