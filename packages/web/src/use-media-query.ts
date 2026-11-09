import { useCallback, useMemo, useSyncExternalStore } from 'react'

/** Read a live browser media query. The caller owns any reaction, such as pausing
 * playback. serverMatches is used for server rendering and initial hydration. */
export function useMediaQuery(query: string, serverMatches = false): boolean {
  const media = useMemo(() => typeof window === 'undefined' ? null : window.matchMedia(query), [query])
  const subscribe = useCallback((notify: () => void) => {
    media?.addEventListener('change', notify)
    return () => media?.removeEventListener('change', notify)
  }, [media])
  const getSnapshot = useCallback(() => media?.matches ?? serverMatches, [media, serverMatches])
  return useSyncExternalStore(subscribe, getSnapshot, () => serverMatches)
}
