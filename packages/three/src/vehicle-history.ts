import { VEHICLE_TRAIL_SEGMENTS, VEHICLE_TRAIL_STEP_SECONDS } from './vehicle-trails.ts'

/** Trail vertices interpolate between stored positions this many study seconds apart. */
export const VEHICLE_TRAIL_HISTORY_STEP_SECONDS = 15
/** Stored positions per journey: the full trail window plus the bracket above it. */
export const VEHICLE_TRAIL_HISTORY_LENGTH =
  (VEHICLE_TRAIL_SEGMENTS * VEHICLE_TRAIL_STEP_SECONDS) / VEHICLE_TRAIL_HISTORY_STEP_SECONDS + 1

/** The latest history grid time at or before a study time. */
export function trailGridStart(time: number): number {
  return Math.floor(time / VEHICLE_TRAIL_HISTORY_STEP_SECONDS) * VEHICLE_TRAIL_HISTORY_STEP_SECONDS
}

/** Vertex interpolation phase between the grid start and the next grid time. */
export function trailGridMix(time: number, gridStart: number): number {
  if (!Number.isFinite(gridStart)) return 0
  return Math.min(1, Math.max(0, (time - gridStart) / VEHICLE_TRAIL_HISTORY_STEP_SECONDS))
}

export type HistorySampler = (time: number) => ArrayLike<number> | undefined

function slot(gridTime: number): number {
  const index = Math.round(gridTime / VEHICLE_TRAIL_HISTORY_STEP_SECONDS) % VEHICLE_TRAIL_HISTORY_LENGTH
  return index < 0 ? index + VEHICLE_TRAIL_HISTORY_LENGTH : index
}

/**
 * Positions sampled on a fixed study-time grid, one ring per journey. Trails
 * read brackets from the ring instead of re-sampling paths on every rebuild;
 * only the grid time crossed since the previous fill costs a path lookup.
 */
export class VehicleHistory {
  readonly samples: Float32Array
  /** Grid time of the latest stored sample per journey; NaN before the first fill. */
  readonly latest: Float64Array

  constructor(readonly count: number) {
    this.samples = new Float32Array(count * VEHICLE_TRAIL_HISTORY_LENGTH * 3)
    this.latest = new Float64Array(count).fill(NaN)
  }

  invalidate(): void {
    this.latest.fill(NaN)
  }

  /** Bring one journey's ring up to gridEnd, sampling only missing grid times. Returns samples taken. */
  fill(index: number, gridEnd: number, sample: HistorySampler): number {
    const latest = this.latest[index]
    if (latest === gridEnd) return 0
    const span = (VEHICLE_TRAIL_HISTORY_LENGTH - 1) * VEHICLE_TRAIL_HISTORY_STEP_SECONDS
    const earliest = gridEnd - span
    let time = Number.isNaN(latest) || latest < earliest || latest > gridEnd
      ? earliest
      : latest + VEHICLE_TRAIL_HISTORY_STEP_SECONDS
    let taken = 0
    for (; time <= gridEnd; time += VEHICLE_TRAIL_HISTORY_STEP_SECONDS) {
      const base = (index * VEHICLE_TRAIL_HISTORY_LENGTH + slot(time)) * 3
      const point = sample(time)
      if (point) {
        this.samples[base] = point[0]
        this.samples[base + 1] = point[1]
        this.samples[base + 2] = point[2]
      } else {
        this.samples[base] = NaN
      }
      taken += 1
    }
    this.latest[index] = gridEnd
    return taken
  }

  /** Copy the stored position at a grid time; false when the journey had none there. */
  read(index: number, gridTime: number, out: Float32Array, offset: number): boolean {
    const latest = this.latest[index]
    const span = (VEHICLE_TRAIL_HISTORY_LENGTH - 1) * VEHICLE_TRAIL_HISTORY_STEP_SECONDS
    if (Number.isNaN(latest) || gridTime > latest || gridTime < latest - span) return false
    const base = (index * VEHICLE_TRAIL_HISTORY_LENGTH + slot(gridTime)) * 3
    const x = this.samples[base]
    if (Number.isNaN(x)) return false
    out[offset] = x
    out[offset + 1] = this.samples[base + 1]
    out[offset + 2] = this.samples[base + 2]
    return true
  }
}
