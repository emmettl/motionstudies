import registryValue from '../../config/feeds/recorder.production.json'
import { readFeedHealth, readFeedRegistry, type FeedHealth } from '../../packages/data/src/feed-observability.mjs'
import { observeFeeds, assessObserverCheck, OBSERVER_LIMITS, type ObserverCheck, type ObserverConfig } from '../../packages/data/src/feed-observer.mjs'

const registry = readFeedRegistry(registryValue)
const HEALTH_URL = 'https://stored-health.invalid/producer.json'
const PRODUCER = 'recorder-minimax'
const bodyLimit = 64 * 1024
interface Settings { enabled: boolean; consumers: ObserverConfig['consumers'] }
export interface Storage {
  get<T>(key: string): Promise<T | undefined>
  put<T>(key: string, value: T): Promise<void>
}
interface ObserverEnv {
  OBSERVER_CONFIG: Settings
  FEED_PUSH_TOKEN?: string
  FEED_READ_TOKEN?: string
  FEED_CONSUMER_TOKENS_JSON?: string
}
export interface Env extends ObserverEnv {
  OBSERVER: { getByName(name: string): { fetch(request: Request): Promise<Response> } }
  REQUEST_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> }
}
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
const error = (reason: string, status: number) => reply({ state: 'unknown', reasons: [reason] }, status)
async function authorized(request: Request, token?: string) {
  if (!token || token.length < 32 || token.length > 256) return false
  const actual = request.headers.get('Authorization') ?? ''
  if (actual.length > 512) return false
  const hash = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))
  const [a, b] = await Promise.all([hash(actual), hash(`Bearer ${token}`)])
  let different = 0
  for (let i = 0; i < a.length; i++) different |= a[i] ^ b[i]
  return different === 0
}
async function readBody(request: Request): Promise<unknown> {
  const size = request.headers.get('Content-Length')
  if (size !== null && (!/^\d+$/.test(size) || Number(size) > bodyLimit)) throw new Error('Body limit')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Body required')
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Body timeout')), 5000) }),
      (async () => {
        const bytes = new Uint8Array(bodyLimit)
        let offset = 0
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          if (offset + value.length > bodyLimit) throw new Error('Body limit')
          bytes.set(value, offset); offset += value.length
        }
        return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, offset)))
      })(),
    ])
  } finally { clearTimeout(timer); void reader.cancel().catch(() => {}) }
}

/** One named object stores only the latest report/check and a persisted attempt reservation. */
export class FeedObserver {
  private queue: Promise<unknown> = Promise.resolve()
  constructor(private ctx: { storage: Storage }, private env: ObserverEnv, private fetcher: typeof fetch = (input, init) => fetch(input, init), private clock = Date.now) {}
  fetch(request: Request): Promise<Response> {
    const next = this.queue.then(() => this.handle(request))
    this.queue = next.catch(() => undefined)
    return next
  }
  private async handle(request: Request): Promise<Response> {
    if (this.env.OBSERVER_CONFIG?.enabled !== true) return error('observer-disabled', 503)
    const path = new URL(request.url).pathname, store = this.ctx.storage
    if (path === '/producer' && request.method === 'PUT') {
      let report: FeedHealth
      try {
        report = readFeedHealth(await readBody(request), registry)
        if (report.producerId !== PRODUCER || Date.parse(report.observedAt) > this.clock() + registry.clockSkewSeconds * 1000) throw new Error('Producer/clock mismatch')
      } catch { return error('report-invalid', 400) }
      const previous = await store.get<{ report: FeedHealth; receivedAt: number }>('producer')
      if (previous) {
        if (JSON.stringify(previous.report) === JSON.stringify(report)) return reply({ accepted: true, replay: true })
        if (Date.parse(report.observedAt) <= Date.parse(previous.report.observedAt) || report.producerGeneratedAt && previous.report.producerGeneratedAt && Date.parse(report.producerGeneratedAt) < Date.parse(previous.report.producerGeneratedAt)) return error('report-out-of-order', 409)
        if (this.clock() - previous.receivedAt < 30000) return error('push-rate-limit', 429)
      }
      await store.put('producer', { report, receivedAt: this.clock() })
      return reply({ accepted: true, replay: false })
    }
    if (path === '/check' && request.method === 'POST') {
      const now = this.clock(), lastAttempt = await store.get<number>('attempt')
      if (lastAttempt !== undefined && now - lastAttempt < 60000) return reply({ skipped: true })
      // Persist before network I/O: duplicate delivery, failures and restarts cannot retry this minute.
      await store.put('attempt', now)
      try {
        const source = await store.get<{ report: FeedHealth }>('producer')
        const checked = await observeFeeds(registry, { schemaVersion: 1, kind: 'feed-observer-config', producerId: PRODUCER, healthUrl: HEALTH_URL, consumers: this.env.OBSERVER_CONFIG.consumers }, {
          clock: this.clock,
          fetchImpl: (input, init) => String(input) === HEALTH_URL ? Promise.resolve(source ? Response.json(source.report) : new Response(null, { status: 404 })) : this.fetcher(input, init),
          tokens: { consumers: JSON.parse(this.env.FEED_CONSUMER_TOKENS_JSON ?? '{}') },
          limits: { ...OBSERVER_LIMITS, healthBytes: bodyLimit },
        })
        if (new TextEncoder().encode(JSON.stringify(checked)).length > 96 * 1024) throw new Error('Check limit')
        await store.put('check', { checked, failedAt: null })
        return reply({ completedAt: checked.completedAt })
      } catch {
        const previous = await store.get<{ checked?: ObserverCheck }>('check')
        await store.put('check', { checked: previous?.checked ?? null, failedAt: new Date(this.clock()).toISOString() })
        return error('checker-failed', 503)
      }
    }
    if (path === '/status' && request.method === 'GET') {
      const saved = await store.get<{ checked?: ObserverCheck; failedAt?: string }>('check')
      const assessment = saved?.failedAt ? { state: 'unknown', reasons: ['checker-failed'] } : assessObserverCheck(registry, saved?.checked, { now: this.clock() })
      return reply({ schemaVersion: 1, kind: 'feed-observer-status', assessedAt: new Date(this.clock()).toISOString(), ...assessment, failedAt: saved?.failedAt ?? null, lastCheck: saved?.checked ?? null }, assessment.state === 'healthy' ? 200 : 503)
    }
    return error('not-found', 404)
  }
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = request.method === 'PUT' && url.pathname === '/api/feeds/v1/producer' ? '/producer' : request.method === 'GET' && url.pathname === '/api/feeds/v1/status' ? '/status' : null
    if (!path || url.search) return error('not-found', 404)
    try {
      if (!await authorized(request, path === '/producer' ? env.FEED_PUSH_TOKEN : env.FEED_READ_TOKEN)) return error('unauthorized', 401)
      if (!(await env.REQUEST_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'unknown' })).success) return error('rate-limit', 429)
      return await env.OBSERVER.getByName('recorder-minimax-v1').fetch(new Request(`https://observer${path}`, request))
    } catch { return error('observer-unavailable', 503) }
  },
  async scheduled(_event: unknown, env: Env): Promise<void> {
    if (env.OBSERVER_CONFIG?.enabled !== true) return
    const response = await env.OBSERVER.getByName('recorder-minimax-v1').fetch(new Request('https://observer/check', { method: 'POST' }))
    if (!response.ok) throw new Error('Feed observer check failed')
  },
}
