import { useId, useMemo, useState, type CSSProperties } from 'react'
import { TimelineScrubber } from './TimelineScrubber.tsx'
import { createTimelineModel, formatTimelineTime, timelineBinAt, timelinePosition, timelineTime, type TimelineBin } from '@motionstudies/core/timeline'

export interface StudyTimelineProps {
  bins: readonly TimelineBin[]
  windowStart: number
  windowEnd: number
  time: number
  onSeek: (time: number) => void
  label: string
  ariaLabel?: string
  description?: string
  variant?: 'bars' | 'line'
  step?: number
  maximum?: number
  disabled?: boolean
  formatTime?: (time: number) => string
  formatValue?: (value: number) => string
  missingLabel?: string
  emptyLabel?: string
  scaleLabel?: string
  onScrubStart?: () => void
  onScrubEnd?: () => void
  className?: string
}
const formatCount = (value: number) => value.toLocaleString()

/** Controlled chart and scrubber. Playback, loading and date/timezone policy belong to the study. */
export function StudyTimeline({ bins, windowStart, windowEnd, time, onSeek, label, ariaLabel = label, description, variant = 'bars', step = 1, maximum, disabled = false, formatTime = formatTimelineTime, formatValue = formatCount, missingLabel = 'No observation', emptyLabel = 'No observations in this window', scaleLabel = 'Scale', onScrubStart, onScrubEnd, className = '' }: StudyTimelineProps) {
  const id = useId(), [hover, setHover] = useState<number>()
  const model = useMemo(() => createTimelineModel(bins, { start: windowStart, end: windowEnd }, maximum), [bins, windowStart, windowEnd, maximum])
  const value = Number(timelineTime(timelinePosition(time, model.window), model.window, step).toPrecision(12)), position = timelinePosition(value, model.window)
  const active = timelineBinAt(model, value), inspected = timelineBinAt(model, hover ?? value)
  const reading = (amount: number | null | undefined) => amount == null ? missingLabel : formatValue(amount)
  return <div className={`ms-study-timeline ${className}`} data-variant={variant} data-disabled={disabled || undefined}>
    <div className="ms-study-timeline__heading"><span id={`${id}-label`}>{label}</span><span className="ms-study-timeline__reading">{formatTime(hover ?? value)} · {reading(inspected?.value)}</span></div>
    <TimelineScrubber className="ms-study-timeline__plot" windowStart={windowStart} windowEnd={windowEnd} time={value} onSeek={onSeek} step={step} disabled={disabled} ariaLabel={ariaLabel} describedBy={description ? `${id}-description` : undefined} ariaValueText={`${formatTime(value)} · ${reading(active?.value)}`} onScrubStart={onScrubStart} onScrubEnd={onScrubEnd} onInspect={setHover}>
      <div className="ms-study-timeline__graph" aria-hidden="true">
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" focusable="false">
          {variant === 'bars' ? model.bars.filter(bar => bar.value !== null && bar.value > 0).map(bar => <rect key={bar.start} x={bar.x * 1000} y={(1 - bar.height) * 100} width={bar.width * 1000 * .8} height={bar.height * 100} />) : model.lines.map((line, i) => line.length === 1 ? <line key={i} x1={line[0].x * 1000 - 1} x2={line[0].x * 1000 + 1} y1={line[0].y * 100} y2={line[0].y * 100} /> : <polyline key={i} points={line.map(p => `${p.x * 1000},${p.y * 100}`).join(' ')} />)}
        </svg>
        <span className="ms-study-timeline__cursor" style={{ left: `${position * 100}%` } as CSSProperties}/>
        {!model.bars.some(bar => bar.value !== null) && <span className="ms-study-timeline__empty">{emptyLabel}</span>}
      </div>
    </TimelineScrubber>
    <div className="ms-study-timeline__ticks" aria-hidden="true">{[0, .25, .5, .75, 1].map(fraction => <span key={fraction}>{formatTime(windowStart + fraction * (windowEnd - windowStart))}</span>)}</div>
    <div className="ms-study-timeline__footnote">{description && <span id={`${id}-description`}>{description}</span>}<span>{scaleLabel} 0–{formatValue(model.maximum)}</span></div>
  </div>
}
