import { airportEnabled, readConfig } from './config.ts'
import type { CoordinatorEnv } from './coordinator.ts'
export { AirportCoordinator } from './coordinator.ts'
export interface Env extends CoordinatorEnv {
  AIRPORTS: { getByName(name: string): { fetch(request: Request): Promise<Response> } }
  REQUEST_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> }
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    let config
    try { config = readConfig(env.FEED_CONFIG) } catch { return new Response('Service unavailable', { status: 503 }) }
    const url = new URL(request.url), origin = request.headers.get('Origin')
    // Same-origin GETs may omit Origin. Accept only the configured site's API origin in that case.
    const allowed = origin ? config.origins.includes(origin) : config.origins.includes(url.origin)
    if (!allowed) return new Response('Forbidden', { status: 403 })
    const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin', 'X-Content-Type-Options': 'nosniff' })
    if (origin) headers.set('Access-Control-Allow-Origin', origin)
    const json = (body: unknown, status = 200) => Response.json(body, { status, headers })
    if (request.method === 'OPTIONS') {
      headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      return new Response(null, { status: 204, headers })
    }
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
    if (!(await env.REQUEST_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'unknown' })).success)
      return json({ version: 1, status: 'unavailable', reason: 'rate-limit', retryAfterSeconds: 60 }, 429)
    const match = /^\/api\/airports\/v1\/([a-z0-9-]+)\/(capabilities|[A-Z]{3}\/board)$/.exec(url.pathname)
    if (!match || url.search) return json({ error: 'Not found' }, 404)
    const edition = Object.hasOwn(config.editions, match[1]) ? config.editions[match[1]] : undefined
    if (!edition) return json({ error: 'Not found' }, 404)
    const capabilities = match[2] === 'capabilities'
    const code = match[2].slice(0, 3)
    if (!capabilities && !airportEnabled(config, match[1], code)) return json({ version: 1, status: 'disabled', reason: 'not-configured', retryAfterSeconds: 300 })
    try {
      const internal = new URL(capabilities ? 'https://coordinator/capabilities' : 'https://coordinator/board')
      internal.search = new URLSearchParams({ edition: match[1], airport: code }).toString()
      const response = await env.AIRPORTS.getByName('airport-feed-v1').fetch(new Request(internal))
      return new Response(response.body, { status: response.status, headers: new Headers([...headers, ['Content-Type', 'application/json']]) })
    } catch { return json({ version: 1, status: 'unavailable', reason: 'provider', retryAfterSeconds: 300 }, 503) }
  },
}
