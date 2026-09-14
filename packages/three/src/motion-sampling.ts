import { VEHICLE_TRAIL_HISTORY_STEP_SECONDS } from './vehicle-history.ts'

/** Real seconds between marker sampling passes on smooth and on struggling frames. */
export const MARKER_SAMPLE_INTERVAL = 0.1
export const MARKER_SAMPLE_INTERVAL_REDUCED = 0.2
/** Longest chord a marker follows between samples, whatever the playback rate. */
export const MAX_MARKER_STEP_SECONDS = 20
/** Trails wait this long after the last seek before refilling their history. */
export const TRAIL_SETTLE_SECONDS = 0.15

/** Study seconds one sampling pass covers ahead of the clock. */
export function markerStepSeconds(playing: boolean, rate: number, interval: number): number {
  if (!playing || !(rate > 0) || !(interval > 0)) return 0
  return Math.min(MAX_MARKER_STEP_SECONDS, rate * interval)
}

export type MotionPass = 'none' | 'update' | 'seek'

/**
 * The study-time window whose end positions are on the GPU. Markers interpolate
 * from the window start toward its end; a new pass is due when the clock leaves
 * the window, when a trail grid time is crossed, or when the clock jumps.
 */
export class MotionSampleWindow {
  start = NaN
  end = NaN
  grid = NaN

  plan(time: number, playing: boolean, rate: number, step: number): MotionPass {
    if (!Number.isFinite(this.end)) return 'seek'
    const tolerance = playing ? Math.max(step, rate * 0.25) : 0
    if (time < this.start - tolerance || time > this.end + tolerance) return 'seek'
    if (playing && (time >= this.end || time < this.start)) return 'update'
    if (Number.isFinite(this.grid) && time >= this.grid + VEHICLE_TRAIL_HISTORY_STEP_SECONDS) return 'update'
    return 'none'
  }

  /** Whether a pass at this time continues the previous window without a gap. */
  continues(time: number): boolean {
    return Number.isFinite(this.end) && time >= this.end && time - this.end <= MAX_MARKER_STEP_SECONDS
  }

  record(start: number, end: number, grid: number): void {
    this.start = start
    this.end = end
    this.grid = grid
  }

  /** Interpolation phase of the current clock inside the recorded window. */
  mix(time: number): number {
    const span = this.end - this.start
    if (!(span > 0)) return 0
    return Math.min(1, Math.max(0, (time - this.start) / span))
  }
}
