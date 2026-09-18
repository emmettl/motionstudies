import type { FeedHealth } from './feed-observability.mjs'
/** Reads only supplied JSON. `now` is the observer's Unix time in milliseconds. */
export function recorderFeedHealth(registry: unknown, status: unknown, options: { producerId: string; now?: number }): FeedHealth
