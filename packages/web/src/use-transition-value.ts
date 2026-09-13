import { useEffect, useRef, useState } from 'react'

export const smoothTransition = (progress: number) => progress * progress * (3 - 2 * progress)
export const cosineTransition = (progress: number) => 0.5 - Math.cos(progress * Math.PI) / 2

/** Animate a scalar from its current value; interruptions reverse from the last frame.
 * Reduced-motion changes settle immediately, including during an active transition. */
export function useTransitionValue(target: number, {
  durationMs = 1600, easing = smoothTransition, steps,
}: { readonly durationMs?: number; readonly easing?: (progress: number) => number; readonly steps?: number } = {}) {
  const current = useRef(target)
  const [value, setValue] = useState(target)
  const [transitioning, setTransitioning] = useState(false)
  useEffect(() => {
    const from = current.current
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const finish = () => {
      cancelAnimationFrame(frame)
      current.current = target
      setValue(target)
      setTransitioning(false)
    }
    if (!Number.isFinite(target) || !Number.isFinite(from)) return
    if (motion.matches || from === target || !(durationMs > 0) || !Number.isFinite(durationMs)) { finish(); return }
    const started = performance.now()
    setTransitioning(true)
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / durationMs)
      const eased = easing(progress)
      const fraction = steps && Number.isFinite(steps) && steps > 0 ? Math.round(eased * steps) / steps : eased
      current.current = from + (target - from) * fraction
      setValue(current.current)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else finish()
    }
    frame = requestAnimationFrame(tick)
    const changed = () => { if (motion.matches) finish() }
    motion.addEventListener('change', changed)
    return () => { cancelAnimationFrame(frame); motion.removeEventListener('change', changed) }
  }, [target, durationMs, easing, steps])
  return { value, transitioning }
}
