import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/** The consumer maps an instant into its own service date, timezone and data window.
 * The consumer may explicitly choose a representative timetable for the present.
 * Return null when its data cannot meaningfully represent that instant.
 */
export function useNowClock(resolveTime: (instant: Date) => number | null) {
  const [active, setActive] = useState(false)
  const [time, setTime] = useState<number | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const running = useRef(false)
  const resolver = useRef(resolveTime)
  useLayoutEffect(() => { resolver.current = resolveTime }, [resolveTime])

  const update = useCallback(() => {
    const next = resolver.current(new Date())
    if (next === null || !Number.isFinite(next)) {
      running.current = false
      setActive(false)
      setUnavailable(true)
      return false
    }
    setTime(next)
    return true
  }, [])

  const start = useCallback(() => {
    setUnavailable(false)
    running.current = update()
    setActive(running.current)
  }, [update])
  const stop = useCallback(() => {
    running.current = false
    setActive(false)
  }, [])

  useEffect(() => {
    if (!active) return
    let frame: number
    const tick = () => {
      if (running.current && update()) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, update])

  return { active, time, unavailable, start, stop }
}
