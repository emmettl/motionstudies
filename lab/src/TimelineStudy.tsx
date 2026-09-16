import { useMemo, useState } from 'react'
import { StudyTimeline } from '@motionstudies/web/components/StudyTimeline'
import { formatTimelineTime } from '@motionstudies/core/timeline'
import '@motionstudies/web/study-timeline.css'

export function TimelineStudy() {
  const [time, setTime] = useState(3600.25), [variant, setVariant] = useState<'bars' | 'line'>('bars')
  const [empty, setEmpty] = useState(false), [overnight, setOvernight] = useState(false), [disabled, setDisabled] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const start = overnight ? 20 * 3600 : 0, end = start + 8 * 3600
  const bins = useMemo(() => empty ? [] : Array.from({ length: 96 }, (_, i) => ({ start: start + i * 300, end: start + (i + 1) * 300, value: i >= 32 && i < 40 ? null : i < 8 ? 0 : Math.round(20 + 18 * Math.sin(i / 9)) })), [start, empty])
  return <>
    <div className="toolbar"><label>Chart <select aria-label="Chart style" value={variant} onChange={event => setVariant(event.target.value as 'bars' | 'line')}><option value="bars">Bars</option><option value="line">Line</option></select></label>
      <label><input type="checkbox" checked={empty} onChange={event => setEmpty(event.target.checked)}/> Empty data</label>
      <label><input type="checkbox" checked={overnight} onChange={event => { setOvernight(event.target.checked); setTime(event.target.checked ? 21 * 3600 : 3600) }}/> Overnight window</label>
      <label><input type="checkbox" checked={disabled} onChange={event => setDisabled(event.target.checked)}/> Disabled</label>
    </div>
    <div style={{maxWidth: 820, padding: 20, background: '#0b1721'}}><StudyTimeline bins={bins} windowStart={start} windowEnd={end} time={time} onSeek={setTime} label="Synthetic network activity" ariaLabel="Study time" description="Invented five-minute counts; the gap is missing evidence, not zero." variant={variant} disabled={disabled} formatValue={n => `${n} vehicles`} onScrubStart={() => setScrubbing(true)} onScrubEnd={() => setScrubbing(false)}/></div>
    <output data-testid="timeline-state">{formatTimelineTime(time)} · {scrubbing ? 'Scrubbing' : 'Ready'}</output>
    <p className="note">The whole chart is a seek target. Use Tab, arrow keys, Home and End, or drag with a mouse or touch. The playhead and chart share a time axis. Measured zero is preserved; unknown intervals break the line. Service time can exceed 24:00.</p>
  </>
}
