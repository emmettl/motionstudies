import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { AirportCoordinator, type BoardBucket, type Storage } from './coordinator.ts'
import worker from './worker.ts'
import { fetchAirport, normalizeBoard } from './provider.ts'
import { readConfig } from './config.ts'
import { isAirportFeedResponse } from '@motionstudies/core/domain/live-airport'
const config = JSON.parse(readFileSync('wrangler.airports.jsonc', 'utf8')).vars.FEED_CONFIG
const payload = {
  departures: [{ number: 'TEST 1', status: 'Delayed', departure: { scheduledTime: { utc: '2026-09-12 23:50Z' }, revisedTime: { utc: '2026-09-13 00:10Z' }, gate: 'A1' }, arrival: { airport: { name: 'Test destination' } } }],
  arrivals: [{ number: 'TEST 2', status: 'Unknown', arrival: { scheduledTime: { utc: '2026-09-13 00:00Z' } }, departure: {} }],
}
function setup(overrides = {}, provider = vi.fn(async () => Response.json(payload))) {
  let time = Date.parse('2026-09-12T22:45:00Z') / 1000
  const values = new Map<string, unknown>(), objects = new Map<string, { body: string; customMetadata: Record<string, string> }>()
  const storage: Storage = {
    get: async <T>(k: string) => values.get(k) as T | undefined,
    put: async (k, v) => { values.set(k, structuredClone(v)) },
    delete: async (k) => values.delete(k),
    list: async <T>({ prefix }: { prefix: string }) => new Map([...values].filter(([k]) => k.startsWith(prefix))) as Map<string, T>,
    setAlarm: vi.fn(async () => {}),
  }
  const bucket: BoardBucket = {
    get: async (k) => { const o = objects.get(k); return o ? { json: async <T>() => JSON.parse(o.body) as T } : null },
    put: async (k, body, options) => { objects.set(k, { body, ...options }) },
    delete: async (k) => { objects.delete(k) },
    list: async () => ({ objects: [...objects].map(([key, v]) => ({ key, customMetadata: v.customMetadata })), truncated: false }),
  }
  const env = { FEED_CONFIG: JSON.stringify({ ...config, ...overrides }), AERODATABOX_KEY: 'synthetic-test-key', BOARDS: bucket }
  const coordinator = new AirportCoordinator({ storage }, env, provider as typeof fetch, () => time)
  const request = () => coordinator.fetch(new Request('https://internal/board?edition=gleislicht&airport=ZRH')).then((r) => r.json())
  return { coordinator, env, objects, values, storage, provider, request, advance: (s: number) => { time += s } }
}
describe('provider adapter', () => {
  it('never follows a redirect carrying the provider key', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.redirect).toBe('manual')
      return new Response(null, { status: 302, headers: { Location: 'https://unapproved.example' } })
    })
    await expect(fetchAirport(config.airports.ZRH, 'synthetic-key', config, 100, fetcher)).rejects.toThrow('Airport provider unavailable')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('preserves scheduled and revised instants across midnight without inventing status or gates', () => {
    const b = normalizeBoard(payload, config.airports.ZRH, 100, config)
    expect(b.departures[0].revisedTime! - b.departures[0].scheduledTime!).toBe(1200)
    expect(b.departures[0]).toMatchObject({ place: 'Test destination', gate: 'A1', status: 'Delayed', tone: 'warning' })
    expect(b.arrivals[0].status).toBeUndefined()
    expect(b.arrivals[0].gate).toBeUndefined()
    const changed = structuredClone(payload); changed.departures[0].departure.revisedTime.utc = '2026-09-13 00:20Z'
    expect(normalizeBoard(changed, config.airports.ZRH, 101, config).departures[0].id).toBe(b.departures[0].id)
    expect(isAirportFeedResponse({ version: 1, status: 'fresh', retryAfterSeconds: 300, snapshot: b })).toBe(true)
    expect(isAirportFeedResponse({ version: 1, status: 'fresh', retryAfterSeconds: 300, snapshot: { ...b, airport: { ...b.airport, timeZone: 'Invalid/Zone' } } })).toBe(false)
  })
  it('rejects malformed payloads and drops untimed rows', () => {
    expect(() => normalizeBoard({}, config.airports.ZRH, 100, config)).toThrow()
    expect(normalizeBoard({ departures: [{ number: 'X' }], arrivals: [] }, config.airports.ZRH, 100, config).departures).toEqual([])
    expect(isAirportFeedResponse({ version: 1, status: 'fresh', retryAfterSeconds: 300 })).toBe(false)
  })
})
describe('shared refresh and budgets', () => {
  it('coalesces concurrent viewers and other editions onto one paid airport fetch', async () => {
    const s = setup({ editions: { ...config.editions, another: { enabled: true, airports: ['ZRH'] } } })
    const responses = await Promise.all([s.request(), s.request(), s.coordinator.fetch(new Request('https://internal/board?edition=another&airport=ZRH')).then((r) => r.json())])
    expect(responses.map((r) => r.status)).toEqual(['fresh', 'fresh', 'fresh'])
    expect(s.provider).toHaveBeenCalledTimes(1)
    expect(s.values.get('usage')).toMatchObject({ daily: 2, monthly: 2 })
    expect([...s.values.keys()].some((key) => key.startsWith('board'))).toBe(false)
  })
  it('serves stale on failure, backs off and removes expired snapshots without traffic', async () => {
    const s = setup(); await s.request(); s.advance(301)
    s.provider.mockRejectedValue(new Error('offline'))
    expect((await s.request()).status).toBe('stale')
    await s.request(); expect(s.provider).toHaveBeenCalledTimes(2)
    s.advance(600); await s.coordinator.alarm()
    expect(s.objects.size).toBe(0)
    expect((await s.request()).snapshot).toBeUndefined()
  })
  it('reserves budget before failed requests and enforces daily and monthly limits', async () => {
    for (const limit of [{ dailyUnitBudget: 2 }, { monthlyUnitBudget: 2 }]) {
      const s = setup(limit); await s.request(); s.advance(301)
      expect(await s.request()).toMatchObject({ status: 'stale', reason: 'budget' })
      expect(s.provider).toHaveBeenCalledTimes(1)
      s.advance(900); expect(await s.request()).toMatchObject({ status: 'unavailable', reason: 'budget' })
    }
    const failed = setup({}, vi.fn(async () => { throw new Error('offline') }))
    await failed.request(); expect(failed.values.get('usage')).toMatchObject({ daily: 2, monthly: 2 })
  })
  it('clears cached data and latches off when the subscription fails', async () => {
    const s = setup(); await s.request(); s.advance(301)
    s.provider.mockImplementation(async () => new Response('', { status: 401 }))
    expect(await s.request()).toMatchObject({ status: 'disabled', reason: 'subscription' })
    expect(s.objects.size).toBe(0)
    s.advance(86400); await s.request(); expect(s.provider).toHaveBeenCalledTimes(2)
    expect(await (await s.coordinator.fetch(new Request('https://internal/capabilities?edition=gleislicht'))).json()).toMatchObject({ enabled: false, airports: [] })
    s.env.FEED_CONFIG = JSON.stringify({ ...config, credentialVersion: config.credentialVersion + 1 })
    s.provider.mockImplementation(async () => Response.json(payload))
    expect((await s.request()).status).toBe('fresh')
    expect(s.values.get('usage')).toMatchObject({ monthly: 6 })
  })
  it('disables cleanly and never fetches for inactive editions or unknown airports', async () => {
    const s = setup(); await s.request()
    s.env.FEED_CONFIG = JSON.stringify({ ...config, enabled: false })
    expect((await s.request()).status).toBe('disabled'); expect(s.objects.size).toBe(0)
    expect(s.provider).toHaveBeenCalledTimes(1)
    const inactive = setup()
    await inactive.coordinator.fetch(new Request('https://internal/board?edition=allchange&airport=ZRH'))
    await inactive.coordinator.fetch(new Request('https://internal/board?edition=gleislicht&airport=LHR'))
    expect(inactive.provider).not.toHaveBeenCalled()
  })
})
describe('public Worker boundary', () => {
  it('checks exact origins, paths and methods before spending quota', async () => {
    const s = setup(), forward = vi.fn((r: Request) => s.coordinator.fetch(r))
    const env = { ...s.env, AIRPORTS: { getByName: () => ({ fetch: forward }) }, REQUEST_LIMITER: { limit: async () => ({ success: true }) } }
    const url = 'https://motionstudies.app/api/airports/v1/gleislicht/ZRH/board'
    expect((await worker.fetch(new Request(url, { headers: { Origin: 'https://motionstudies.app.evil.example' } }), env)).status).toBe(403)
    expect((await worker.fetch(new Request(url + '?airport=LHR'), env)).status).toBe(404)
    expect((await worker.fetch(new Request(url, { method: 'POST' }), env)).status).toBe(405)
    expect(forward).not.toHaveBeenCalled()
    const response = await worker.fetch(new Request(url, { headers: { Origin: 'https://emmettl.github.io' } }), env)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://emmettl.github.io')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect((await response.json()).status).toBe('fresh')
  })
  it('capabilities and preflight never call the paid provider', async () => {
    const s = setup(), env = { ...s.env, AIRPORTS: { getByName: () => s.coordinator }, REQUEST_LIMITER: { limit: async () => ({ success: true }) } }
    const u = 'https://motionstudies.app/api/airports/v1/gleislicht/capabilities'
    expect((await worker.fetch(new Request(u, { method: 'OPTIONS', headers: { Origin: 'https://emmettl.github.io' } }), env)).status).toBe(204)
    expect(await (await worker.fetch(new Request(u), env)).json()).toMatchObject({ enabled: true, airports: ['ZRH'] })
    expect(s.provider).not.toHaveBeenCalled()
  })
  it('fails closed for invalid configuration and rate limits', async () => {
    expect(() => readConfig(JSON.stringify({ ...config, origins: ['https://motionstudies.app/path'] }))).toThrow()
    const s = setup(), env = { ...s.env, AIRPORTS: { getByName: () => s.coordinator }, REQUEST_LIMITER: { limit: async () => ({ success: false }) } }
    expect((await worker.fetch(new Request('https://motionstudies.app/api/airports/v1/gleislicht/ZRH/board'), env)).status).toBe(429)
    expect(s.provider).not.toHaveBeenCalled()
  })
})
