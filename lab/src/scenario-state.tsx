import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from 'react'

import { currentSearch, subscribeSearch, updateQuery } from './url-store.ts'
export { updateQuery } from './url-store.ts'
export const InstanceContext = createContext(0)
export function useSearch() { return useSyncExternalStore(subscribeSearch, currentSearch) }

function read<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback
  try {
    const value: unknown = JSON.parse(raw)
    if ((typeof value !== typeof fallback && !(fallback === undefined && typeof value === 'string')) || (typeof value === 'number' && !Number.isFinite(value))) return fallback
    if (value !== null && typeof value === 'object') return fallback
    return value as T
  } catch { return fallback }
}

/** Persist explicitly declared consumer controls; fetched data and DOM objects stay local. */
export function useScenarioState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const search = useSearch(), instance = useContext(InstanceContext)
  const [base] = useState(initial)
  const study = new URLSearchParams(search).get('study') ?? 'controls'
  const name = `v${instance || ''}.${study}.${key}`
  const value = useMemo(() => {
    const candidate = read(new URLSearchParams(search).get(name), base)
    const bounds: Record<string, [number, number]> = { phase: [0, 1], exaggeration: [.5, 4], progress: [0, 1], mix: [0, 1], diagram: [0, 1], scaleKm: [30, 200], budget: [0, 48], sliceIndex: [0, 2], step: [0, 10000] }
    const limit = key === 'time' && study === 'fields' ? [0, 24] : bounds[key]
    return typeof candidate === 'number' && limit && (candidate < limit[0] || candidate > limit[1] || ((key === 'phase' || key === 'sliceIndex' || key === 'step') && !Number.isInteger(candidate))) ? base : candidate
  }, [search, name, base, study, key])
  const set = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    const current = read(new URLSearchParams(currentSearch()).get(name), base)
    const result = next instanceof Function ? next(current) : next
    window.dispatchEvent(new CustomEvent('lab:callback', { detail: { name: `${instance}:${key}` } }))
    updateQuery({ [name]: result === undefined ? null : JSON.stringify(result) })
  }, [name, base, instance, key])
  return [value, set]
}
