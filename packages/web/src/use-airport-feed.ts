import { useEffect, useState } from 'react'
import { isAirportFeedResponse, type AirportFeedResponse, type AirportFeedCapabilities } from '@motionstudies/core/domain/live-airport'
export interface AirportFeedState {
  readonly available: boolean
  readonly checking: boolean
  readonly loading: boolean
  readonly response?: AirportFeedResponse
}
/** Fetch capabilities without paid work; poll boards only while Now is selected. */
export function useAirportFeed(baseUrl: string, edition: string, airport: string, enabled: boolean): AirportFeedState {
  const source = `${baseUrl.replace(/\/$/, '')}/api/airports/v1/${encodeURIComponent(edition)}`
  const identity = `${source}/${airport}/${enabled}`
  const empty: AirportFeedState = { available: false, checking: true, loading: false }
  const [stored, setStored] = useState<AirportFeedState & { identity: string }>({ ...empty, identity })
  const state = stored.identity === identity ? stored : empty
  useEffect(() => {
    const controller = new AbortController()
    let timer: number | undefined, failures = 0
    const update = (patch: Partial<AirportFeedState>) => {
      if (!controller.signal.aborted) setStored((old) => ({ ...(old.identity === identity ? old : empty), ...patch, identity }))
    }
    update(empty)
    const tick = async () => {
      let delay = 60_000
      if (document.hidden) { timer = window.setTimeout(() => void tick(), delay); return }
      try {
        const options = { cache: 'no-store' as const, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]) }
        const capabilitiesResponse = await fetch(`${source}/capabilities`, options)
        if (!capabilitiesResponse.ok) throw new Error('Capabilities unavailable')
        const capabilities = await capabilitiesResponse.json() as AirportFeedCapabilities
        if (capabilities.version !== 1 || typeof capabilities.enabled !== 'boolean' || !Array.isArray(capabilities.airports)) throw new Error('Invalid capabilities')
        const available = capabilities.enabled && capabilities.airports.includes(airport)
        update({ available, checking: false })
        if (!available) {
          update({ loading: false, response: { version: 1, status: 'disabled', reason: 'disabled', retryAfterSeconds: 60 } })
        } else if (enabled) {
          update({ loading: true })
          const r = await fetch(`${source}/${encodeURIComponent(airport)}/board`, options)
          const response: unknown = await r.json()
          if (!isAirportFeedResponse(response)) throw new Error('Invalid board')
          if (response.snapshot && (response.snapshot.airport.iata !== airport || response.snapshot.fetchedAt > Date.now() / 1000 + 60)) throw new Error('Mismatched board')
          update({ response, loading: false, available: response.status !== 'disabled' })
          // Check capabilities every minute even when the upstream circuit is paused.
        }
        failures = 0
      } catch {
        failures += 1
        delay = Math.min(300_000, 30_000 * 2 ** Math.min(failures, 4))
        if (!controller.signal.aborted) setStored((old) => {
          const snapshot = old.identity === identity ? old.response?.snapshot : undefined
          return { identity, available: old.identity === identity && old.available, checking: false, loading: false,
            response: { version: 1, status: snapshot && snapshot.expiresAt > Date.now() / 1000 ? 'stale' : 'unavailable', reason: 'provider', retryAfterSeconds: delay / 1000,
              ...(snapshot && snapshot.expiresAt > Date.now() / 1000 ? { snapshot } : {}) } }
        })
      } finally {
        if (!controller.signal.aborted) timer = window.setTimeout(() => void tick(), delay)
      }
    }
    void tick()
    return () => { controller.abort(); window.clearTimeout(timer) }
  // empty is deliberately reconstructed only when the source effect restarts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, source, airport, enabled])
  return state
}
