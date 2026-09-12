import type { AirportFeedResponse, LiveAirportSnapshot } from '@motionstudies/core/domain/live-airport'
import { airportEnabled, readConfig, type FeedConfig } from './config.ts'
import { fetchAirport, ProviderError } from './provider.ts'
export interface Storage {
  get<T>(key: string): Promise<T | undefined>
  put<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<boolean>
  list<T>(options: { prefix: string }): Promise<Map<string, T>>
  setAlarm(time: number): Promise<void>
}
export interface BoardBucket {
  get(key: string): Promise<{ json<T>(): Promise<T> } | null>
  put(key: string, body: string, options: { customMetadata: Record<string, string> }): Promise<unknown>
  delete(key: string): Promise<void>
  list(options: { prefix: string; include: string[] }): Promise<{ objects: { key: string; customMetadata?: Record<string, string> }[]; truncated: boolean }>
}
export interface CoordinatorEnv { FEED_CONFIG: string | FeedConfig; AERODATABOX_KEY?: string; BOARDS: BoardBucket }
interface Control { nextAttempt: number; failures: number; blocked?: boolean }
interface Usage { day: string; daily: number; month: string; monthly: number }
/** A single named Durable Object serializes ALL refreshes, including budget reservations. */
export class AirportCoordinator {
  private queue: Promise<unknown> = Promise.resolve()
  constructor(private ctx: { storage: Storage }, private env: CoordinatorEnv, private fetcher: typeof fetch = (input, init) => fetch(input, init), private now = () => Date.now() / 1000) {}
  private serial<T>(job: () => Promise<T>): Promise<T> {
    const next = this.queue.then(job, job)
    this.queue = next.catch(() => undefined)
    return next
  }
  fetch(request: Request) {
    return this.serial(async () => {
      const url = new URL(request.url), config = readConfig(this.env.FEED_CONFIG)
      const controlKey = `control:${config.credentialVersion}`
      const edition = url.searchParams.get('edition') ?? '', code = url.searchParams.get('airport') ?? ''
      if (url.pathname === '/capabilities') {
        const control = await this.ctx.storage.get<Control>(controlKey)
        const e = Object.hasOwn(config.editions, edition) ? config.editions[edition] : undefined
        const enabled = !!(config.enabled && this.env.AERODATABOX_KEY && e?.enabled && !control?.blocked)
        if (!config.enabled || !this.env.AERODATABOX_KEY || control?.blocked) await this.purge()
        return Response.json({ version: 1, enabled, airports: enabled ? e!.airports : [] })
      }
      const off = (reason: AirportFeedResponse['reason']): AirportFeedResponse => ({ version: 1, status: 'disabled', reason, retryAfterSeconds: 300 })
      const reply = (body: AirportFeedResponse) => Response.json(body)
      if (!config.enabled || !this.env.AERODATABOX_KEY) { await this.purge(); return reply(off('disabled')) }
      if (!airportEnabled(config, edition, code)) return reply(off('not-configured'))
      const now = this.now(), store = this.ctx.storage
      const control = await store.get<Control>(controlKey) ?? { nextAttempt: 0, failures: 0 }
      // Authentication/subscription failures latch off until explicitly reset after recovery.
      if (control.blocked) return reply(off('subscription'))
      const cached = await (await this.env.BOARDS.get(`board/${code}.json`))?.json<LiveAirportSnapshot>()
      const fallback = (reason: AirportFeedResponse['reason'], retry = 300): AirportFeedResponse => cached && now < cached.expiresAt
        ? { version: 1, status: 'stale', reason, retryAfterSeconds: retry, snapshot: cached }
        : { version: 1, status: 'unavailable', reason, retryAfterSeconds: retry }
      if (cached && now < cached.freshUntil) return reply({ version: 1, status: 'fresh', retryAfterSeconds: Math.ceil(cached.freshUntil - now), snapshot: cached })
      if (control.nextAttempt > now) return reply(fallback('provider', Math.ceil(control.nextAttempt - now)))
      const date = new Date(now * 1000).toISOString(), day = date.slice(0, 10), month = date.slice(0, 7)
      const old = await store.get<Usage>('usage')
      const usage = { day, month, daily: old?.day === day ? old.daily : 0, monthly: old?.month === month ? old.monthly : 0 }
      if (usage.daily + 2 > config.dailyUnitBudget || usage.monthly + 2 > config.monthlyUnitBudget) return reply(fallback('budget', 3600))
      // Reserve before the external request; failed or interrupted calls still consume budget.
      await store.put('usage', { ...usage, daily: usage.daily + 2, monthly: usage.monthly + 2 })
      await store.put(controlKey, { ...control, nextAttempt: now + config.refreshSeconds })
      try {
        const snapshot = await fetchAirport(config.airports[code], this.env.AERODATABOX_KEY, config, now, this.fetcher)
        // Arm deletion before storing data, so even an interrupted refresh has a cleanup wakeup.
        await store.setAlarm((now + 60) * 1000)
        await this.env.BOARDS.put(`board/${code}.json`, JSON.stringify(snapshot), { customMetadata: { expiresAt: String(snapshot.expiresAt), airport: code } })
        await store.put(controlKey, { nextAttempt: 0, failures: 0 })
        return reply({ version: 1, status: 'fresh', retryAfterSeconds: config.refreshSeconds, snapshot })
      } catch (error) {
        console.warn(JSON.stringify({ event: 'airport-refresh-failed', airport: code,
          kind: error instanceof Error ? error.name : 'Unknown', category: error instanceof Error ? (/Illegal invocation/i.test(error.message) ? 'binding' : /not a function/i.test(error.message) ? 'missing-function' : /fetch|network/i.test(error.message) ? 'network' : 'other') : 'unknown', providerStatus: error instanceof ProviderError ? error.status : undefined }))
        if (error instanceof ProviderError && [401, 402, 403].includes(error.status)) {
          await store.put(controlKey, { blocked: true, nextAttempt: 0, failures: control.failures + 1 })
          await this.purge()
          return reply(off('subscription'))
        }
        const failures = control.failures + 1
        const retry = Math.max(Math.min(3600, 300 * 2 ** Math.min(failures - 1, 4)), error instanceof ProviderError ? error.retrySeconds : 300)
        await store.put(controlKey, { failures, nextAttempt: now + retry })
        return reply(fallback('provider', retry))
      }
    })
  }
  private async purge() {
    for (const item of (await this.env.BOARDS.list({ prefix: 'board/', include: ['customMetadata'] })).objects) await this.env.BOARDS.delete(item.key)
  }
  private async cleanup() {
    const now = this.now(), c = readConfig(this.env.FEED_CONFIG)
    const active = new Set(Object.values(c.editions).filter((e) => c.enabled && e.enabled).flatMap((e) => e.airports))
    let next = Infinity
    for (const item of (await this.env.BOARDS.list({ prefix: 'board/', include: ['customMetadata'] })).objects) {
      const expiry = Number(item.customMetadata?.expiresAt)
      if (!active.has(item.customMetadata?.airport ?? '') || !Number.isFinite(expiry) || now >= expiry) await this.env.BOARDS.delete(item.key)
      else next = Math.min(next, expiry)
    }
    if (Number.isFinite(next)) await this.ctx.storage.setAlarm(Math.min(next * 1000, (now + 60) * 1000))
  }
  alarm() { return this.serial(() => this.cleanup()) }
}
