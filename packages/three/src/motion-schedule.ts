/** Shortest real-time window a playing journey is given, so fast machines do not refresh every frame. */
export const MIN_WINDOW_REAL_SECONDS = 0.1
/** Longest chord a marker follows, so routes are not visibly cut at street zoom. */
export const MAX_CHORD_SECONDS = 30
/** Real seconds a playing marker may sit past its window before it is hidden rather than shown out of place. */
export const STALE_REAL_SECONDS = 0.75
/** Per-frame budget while catching up after a seek, selection or geometry change. */
export const CONVERGE_BUDGET_MS = 48
/** Trails wait this long after a run of seeks before refilling their history. */
export const TRAIL_SETTLE_SECONDS = 0.15

/**
 * Milliseconds of vehicle sampling allowed in one frame. The budget grows while
 * frames are smooth and shrinks while they are slow, unless motion is falling
 * so far behind that markers would be hidden; then it grows while frames stay
 * above roughly 24 FPS.
 */
export class MotionFrameBudget {
  private average = 1 / 60
  private budget: number
  private longFrames = 0

  constructor(
    readonly minimumMs = 3,
    readonly maximumMs = 24,
    startMs = 6,
  ) {
    this.budget = Math.min(maximumMs, Math.max(minimumMs, startMs))
  }

  get milliseconds(): number {
    return this.budget
  }

  /** Frames are sustained below about 40 FPS. */
  get reduced(): boolean {
    return this.average > 1 / 40
  }

  update(delta: number, behind = false): number {
    if (!Number.isFinite(delta) || delta <= 0) return this.budget
    // Ignore one long resume or loading gap; repeated long frames still count.
    if (delta >= 0.25) {
      this.longFrames += 1
      if (this.longFrames < 2) return this.budget
      delta = 0.25
    } else this.longFrames = 0
    this.average += (delta - this.average) * (1 - Math.exp(-delta / 0.35))
    if (this.average < 1 / 50) this.budget *= 1.1
    else if (behind && this.average < 1 / 24) this.budget *= 1.05
    else if (!behind && this.average > 1 / 35) this.budget *= 0.9
    this.budget = Math.min(this.maximumMs, Math.max(this.minimumMs, this.budget))
    return this.budget
  }
}

/** Study seconds a refreshed journey's chord should cover before its next refresh is expected. */
export function motionLookahead(playing: boolean, rate: number, cycleRealSeconds: number): number {
  if (!playing || !(rate > 0)) return 0
  const cycle = Number.isFinite(cycleRealSeconds) && cycleRealSeconds > 0 ? cycleRealSeconds * 1.5 : 0
  return Math.min(MAX_CHORD_SECONDS, rate * Math.max(MIN_WINDOW_REAL_SECONDS, cycle))
}

/** Study seconds the clock may run past a window before its vertex is hidden. Paused scenes allow none. */
export function motionStaleSeconds(playing: boolean, rate: number): number {
  if (!playing) return 0
  return Math.max(MAX_CHORD_SECONDS, (rate > 0 ? rate : 0) * STALE_REAL_SECONDS)
}

/**
 * Estimates how long, in real seconds, the scheduler takes to revisit every
 * active journey. When a frame finishes all due work the cycle is one frame;
 * when the budget runs out it is active journeys over measured throughput.
 */
export class MotionCycle {
  private throughput = NaN
  private cycle = 0

  get seconds(): number {
    return this.cycle
  }

  record(refreshed: number, delta: number, exhausted: boolean, active: number): number {
    if (!Number.isFinite(delta) || delta <= 0) return this.cycle
    const frame = Math.min(delta, 0.25)
    if (!exhausted) {
      this.cycle = frame
      return this.cycle
    }
    const sample = refreshed / frame
    this.throughput = Number.isFinite(this.throughput) ? this.throughput + (sample - this.throughput) * 0.2 : sample
    this.cycle = this.throughput > 0 ? Math.min(10, Math.max(frame, active / this.throughput)) : 10
    return this.cycle
  }
}
