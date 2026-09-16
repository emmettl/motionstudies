import { useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { timelinePosition, timelineTime } from '@motionstudies/core/timeline'

export interface TimelineScrubberProps {
  windowStart: number
  windowEnd: number
  time: number
  onSeek: (time: number) => void
  ariaLabel: string
  ariaValueText?: string
  describedBy?: string
  step?: number
  disabled?: boolean
  onScrubStart?: () => void
  onScrubEnd?: () => void
  onInspect?: (time: number | undefined) => void
  children?: ReactNode
  className?: string
}

/** Shared visible rail and native range interaction; the caller owns the clock. */
export function TimelineScrubber({ windowStart, windowEnd, time, onSeek, ariaLabel, ariaValueText, describedBy, step = 1, disabled = false, onScrubStart, onScrubEnd, onInspect, children, className = '' }: TimelineScrubberProps) {
  const id = useId(), scrubbing = useRef(false)
  const window = { start: windowStart, end: windowEnd }
  const value = Number(timelineTime(timelinePosition(time, window), window, step).toPrecision(12))
  const position = timelinePosition(value, window)
  const begin = () => { if (!disabled && !scrubbing.current) { scrubbing.current = true; onScrubStart?.() } }
  const finish = () => { if (scrubbing.current) { scrubbing.current = false; onScrubEnd?.() } }
  return <div className={`ms-timeline-scrubber ${className}`} data-disabled={disabled || undefined} style={{ '--ms-timeline-position': `${position * 100}%` } as CSSProperties}>
    {children}
    <div className="ms-timeline-scrubber__rail" aria-hidden="true"><span className="ms-timeline-scrubber__fill"/><span className="ms-timeline-scrubber__thumb"/></div>
    <input id={id} type="range" aria-label={ariaLabel} aria-valuetext={ariaValueText} aria-describedby={describedBy} min={windowStart} max={windowEnd} step={step} value={value} disabled={disabled}
      onChange={event => onSeek(Number(event.target.value))}
      onPointerDown={event => { if (!disabled) { event.currentTarget.setPointerCapture(event.pointerId); begin() } }}
      onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
      onBlur={() => { finish(); onInspect?.(undefined) }}
      onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) begin() }} onKeyUp={finish}
      onPointerMove={event => { if (disabled || event.pointerType === 'touch' || !onInspect) return; const box = event.currentTarget.getBoundingClientRect(); onInspect(timelineTime((event.clientX - box.left - 22) / Math.max(1, box.width - 44), window, step)) }} onPointerLeave={() => onInspect?.(undefined)} />
  </div>
}
