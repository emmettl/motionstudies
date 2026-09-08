import { useCallback, useEffect, useRef, useState } from 'react'

export interface BrowserLocation {
  readonly longitude: number
  readonly latitude: number
  readonly accuracy: number
}

export type BrowserLocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'timeout' | 'unavailable'

/** One explicit request, kept in memory. Clearing or unmounting ignores late replies. */
export function useBrowserLocation() {
  const [location, setLocation] = useState<BrowserLocation>()
  const [status, setStatus] = useState<BrowserLocationStatus>('idle')
  const request = useRef(0)
  useEffect(() => () => { request.current += 1 }, [])

  const clear = useCallback(() => {
    request.current += 1
    setLocation(undefined)
    setStatus('idle')
  }, [])
  const locate = useCallback(() => {
    const id = ++request.current
    setLocation(undefined)
    if (!navigator.geolocation) {
      setStatus('unavailable')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (request.current !== id) return
      if (!Number.isFinite(coords.longitude) || !Number.isFinite(coords.latitude) ||
        Math.abs(coords.longitude) > 180 || Math.abs(coords.latitude) > 90 ||
        !Number.isFinite(coords.accuracy) || coords.accuracy < 0) {
        setStatus('unavailable')
        return
      }
      setLocation({ longitude: coords.longitude, latitude: coords.latitude, accuracy: coords.accuracy })
      setStatus('ready')
    }, (error) => {
      if (request.current !== id) return
      setStatus(error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable')
    }, { enableHighAccuracy: false, maximumAge: 0, timeout: 10_000 })
  }, [])

  return { location, status, locate, clear }
}
