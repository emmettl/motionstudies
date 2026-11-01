const changed = 'lab:url-change'
const storageKey = `lab:pending-url:${location.pathname}`
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (saved && ['reload', 'back_forward'].includes(navigation?.type ?? '') && saved.base === location.search && typeof saved.search === 'string') history.replaceState(null, '', `${location.pathname}${saved.search}${location.hash}`)
  sessionStorage.removeItem(storageKey)
} catch { /* The address bar and reproduction links still work when storage is unavailable. */ }
let pending: string | null = null, timer: number | undefined, lastWrite = -Infinity
export const currentSearch = () => pending ?? location.search
function flush() {
  if (timer !== undefined) window.clearTimeout(timer)
  timer = undefined
  if (pending === null) return
  history.replaceState(null, '', `${location.pathname}${pending}${location.hash}`)
  pending = null
  lastWrite = performance.now()
}
export function subscribeSearch(listener: () => void) {
  const pop = () => { if (timer !== undefined) window.clearTimeout(timer); timer = undefined; pending = null; listener() }
  window.addEventListener('popstate', pop)
  window.addEventListener(changed, listener)
  return () => { window.removeEventListener('popstate', pop); window.removeEventListener(changed, listener) }
}
export function updateQuery(values: Record<string, string | null>, push = false) {
  const url = new URL(location.href)
  url.search = currentSearch()
  for (const [key, value] of Object.entries(values)) {
    if (value === null) url.searchParams.delete(key); else url.searchParams.set(key, value)
  }
  if (url.search === currentSearch()) return
  const before = new URLSearchParams(currentSearch())
  const discrete = Object.entries(values).some(([key, value]) => {
    if (before.get(key) === value) return false
    if (value === null) return true
    try { return typeof JSON.parse(value) !== 'number' } catch { return true }
  })
  if (push) { flush(); history.pushState(null, '', url); lastWrite = performance.now() }
  else {
    pending = url.search
    // Playback updates the in-memory controls immediately; History writes stay below engine rate limits.
    if (discrete || performance.now() - lastWrite >= 500) flush()
    else if (timer === undefined) timer = window.setTimeout(flush, 500 - (performance.now() - lastWrite))
  }
  window.dispatchEvent(new Event(changed))
  if (window.parent !== window) window.parent.postMessage({ type: 'lab:state', search: url.search }, location.origin)
}
window.addEventListener('pagehide', () => {
  if (pending === null) return
  // Reload chooses its destination before pagehide. Preserve the last numeric control value separately.
  try { sessionStorage.setItem(storageKey, JSON.stringify({ base: location.search, search: pending })) } catch { /* Optional persistence. */ }
})
