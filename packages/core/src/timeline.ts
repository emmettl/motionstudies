/** A measured interval. Null means missing evidence; zero is a measured zero. */
export interface TimelineBin { start: number; end: number; value: number | null }
export interface TimelineWindow { start: number; end: number }
export interface TimelineBar extends TimelineBin { x: number; width: number; height: number }
export interface TimelineModel { window: TimelineWindow; maximum: number; bars: TimelineBar[]; lines: { x: number; y: number }[][] }

function checkWindow(window: TimelineWindow) {
  if (!Number.isFinite(window.start) || !Number.isFinite(window.end) || window.end <= window.start) throw new Error('Timeline needs a finite, increasing window')
}

export function timelinePosition(time: number, window: TimelineWindow): number {
  checkWindow(window)
  return Number.isFinite(time) ? Math.max(0, Math.min(1, (time - window.start) / (window.end - window.start))) : 0
}

export function timelineTime(position: number, window: TimelineWindow, step = 1): number {
  checkWindow(window)
  if (!Number.isFinite(step) || step <= 0) throw new Error('Timeline step must be positive')
  const fraction = Number.isFinite(position) ? Math.max(0, Math.min(1, position)) : 0
  return Math.min(window.end, window.start + Math.round(fraction * (window.end - window.start) / step) * step)
}

/** Build chart geometry once per series, independently of playback and rendering. */
export function createTimelineModel(bins: readonly TimelineBin[], window: TimelineWindow, maximum?: number): TimelineModel {
  checkWindow(window)
  if (maximum !== undefined && (!Number.isFinite(maximum) || maximum < 0)) throw new Error('Timeline maximum must be non-negative')
  const sorted = [...bins].sort((a, b) => a.start - b.start)
  let previous = -Infinity
  for (const bin of sorted) {
    if (!Number.isFinite(bin.start) || !Number.isFinite(bin.end) || bin.end <= bin.start || bin.start < previous) throw new Error('Timeline bins must be finite, increasing and non-overlapping')
    if (bin.value !== null && (!Number.isFinite(bin.value) || bin.value < 0)) throw new Error('Timeline values must be non-negative or null')
    previous = bin.end
  }
  const visible = sorted.filter(bin => bin.end > window.start && bin.start < window.end)
  const peak = maximum ?? visible.reduce((value, bin) => Math.max(value, bin.value ?? 0), 0)
  const bars = visible.map(bin => {
    const start = Math.max(window.start, bin.start), end = Math.min(window.end, bin.end)
    return { ...bin, start, end, x: timelinePosition(start, window), width: (end - start) / (window.end - window.start), height: peak > 0 && bin.value !== null ? Math.min(1, bin.value / peak) : 0 }
  })
  const lines: TimelineModel['lines'] = []
  let line: TimelineModel['lines'][number] = [], lastEnd = -Infinity
  for (const bar of bars) {
    if (bar.value === null || bar.start !== lastEnd) {
      if (line.length) lines.push(line)
      line = []
    }
    if (bar.value !== null) line.push({ x: bar.x + bar.width / 2, y: 1 - bar.height })
    lastEnd = bar.end
  }
  if (line.length) lines.push(line)
  return { window: { ...window }, maximum: peak, bars, lines }
}

export function timelineBinAt(model: TimelineModel, time: number): TimelineBar | undefined {
  let lo = 0, hi = model.bars.length
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (model.bars[mid].start <= time) lo = mid + 1; else hi = mid }
  const bin = model.bars[lo - 1]
  return bin && time < bin.end ? bin : undefined
}

/** Service time, including 24:00 and times beyond midnight; no timezone inference. */
export function formatTimelineTime(seconds: number): string {
  const minutes = Math.floor(Math.max(0, Number.isFinite(seconds) ? seconds : 0) / 60)
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
