import { useCallback, useEffect, useState } from 'react'

const identity = <T,>(value: unknown): T => value as T
interface AssetState<T> {
  readonly url: string | undefined
  readonly parse: (value: unknown) => T
  readonly attempt: number
  readonly data?: T
  readonly error?: boolean
  readonly unavailable?: boolean
}

/** A single optional asset, cached until its URL/parser changes or retry is called.
 * Keep parse stable. Source compatibility and schema checks belong in that parser. */
export function useJsonAsset<T>(url: string | undefined, enabled = true,
  parse: (value: unknown) => T = identity, optional = false) {
  const [attempt, setAttempt] = useState(0)
  const [stored, setStored] = useState<AssetState<T>>({ url, parse, attempt })
  const state = stored.url === url && stored.parse === parse && stored.attempt === attempt
    ? stored : { url, parse, attempt }
  if (stored !== state) setStored(state)
  const { data, error, unavailable } = state

  useEffect(() => {
    if (!enabled || !url || data !== undefined || unavailable) return
    const controller = new AbortController()
    const save = (result: Partial<AssetState<T>>) => {
      if (!controller.signal.aborted) setStored(current =>
        current.url === url && current.parse === parse && current.attempt === attempt
          ? { ...current, ...result } : current)
    }
    void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal })
        if (optional && response.status === 404) { save({ unavailable: true, error: false }); return }
        if (!response.ok) throw new Error(`Asset returned ${response.status}`)
        const next = parse(await response.json())
        if (next === undefined) throw new Error('Asset parser returned no data')
        save({ data: next, error: false })
      } catch { save({ error: true }) }
    })()
    return () => controller.abort()
  }, [url, enabled, parse, optional, attempt, data, unavailable])

  const retry = useCallback(() => setAttempt(value => value + 1), [])
  return { data, error: Boolean(error), unavailable: Boolean(unavailable),
    loading: Boolean(enabled && url && data === undefined && !error && !unavailable), retry }
}
