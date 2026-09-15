import type { NetworkTrain } from '@motionstudies/core/domain/network'
import { VehicleHistory } from './vehicle-history.ts'

/** Needs a refresh before anything it holds can be drawn. */
export const MOTION_STALE = 0
/** Marker follows the chord in `from`/`to` across `windows`. */
export const MOTION_MOVING = 1
/** Journey has ended; `from` holds its terminal for arrival labels and collapsing trails. */
export const MOTION_TERMINAL = 2
/** Nothing to draw until the clock leaves the valid interval. */
export const MOTION_HIDDEN = 3
/** Outside the view; re-evaluated when the clock or view generation moves on. */
export const MOTION_CULLED = 4

export type MotionState =
  | typeof MOTION_STALE | typeof MOTION_MOVING | typeof MOTION_TERMINAL | typeof MOTION_HIDDEN | typeof MOTION_CULLED

/**
 * Per-journey motion shared by the moving-vehicle layer and train labels.
 * Every journey carries its own study-time window and validity interval, so
 * the scheduler can refresh a budgeted slice each frame.
 */
export class VehicleMotionTable {
  readonly index: ReadonlyMap<NetworkTrain, number>
  readonly from: Float32Array
  readonly to: Float32Array
  /** Study-time chord window per journey: [start, end]. */
  readonly windows: Float64Array
  readonly validFrom: Float64Array
  readonly validTo: Float64Array
  readonly state: Uint8Array
  readonly viewStamps: Uint32Array
  readonly history: VehicleHistory

  constructor(trains: readonly NetworkTrain[]) {
    this.index = new Map(trains.map((train, index) => [train, index]))
    this.from = new Float32Array(trains.length * 3)
    this.to = new Float32Array(trains.length * 3)
    this.windows = new Float64Array(trains.length * 2)
    this.validFrom = new Float64Array(trains.length).fill(-Infinity)
    this.validTo = new Float64Array(trains.length).fill(Infinity)
    this.state = new Uint8Array(trains.length)
    this.viewStamps = new Uint32Array(trains.length)
    this.history = new VehicleHistory(trains.length)
  }

  /** Whether the journey has a drawable marker or terminal position. */
  placed(index: number): boolean {
    const state = this.state[index]
    return state === MOTION_MOVING || state === MOTION_TERMINAL
  }

  /**
   * Write the position drawn at `time`. Returns false when the journey has no
   * marker, or when the clock is further than `stale` from its window.
   */
  displayed(index: number, time: number, stale: number, out: { [component: number]: number }): boolean {
    const state = this.state[index]
    const base = index * 3
    if (state === MOTION_TERMINAL) {
      out[0] = this.from[base]
      out[1] = this.from[base + 1]
      out[2] = this.from[base + 2]
      return true
    }
    if (state !== MOTION_MOVING) return false
    const start = this.windows[index * 2]
    const end = this.windows[index * 2 + 1]
    if (time < start - stale || time > end + stale) return false
    const mix = end > start ? Math.min(1, Math.max(0, (time - start) / (end - start))) : 0
    for (let component = 0; component < 3; component += 1) {
      const from = this.from[base + component]
      out[component] = from + (this.to[base + component] - from) * mix
    }
    return true
  }

  /** Whether the journey needs a refresh at `time`. Playing journeys refresh on reaching `validTo`. */
  due(index: number, time: number, playing: boolean, viewGeneration: number): boolean {
    const state = this.state[index]
    if (state === MOTION_STALE) return true
    if (state === MOTION_CULLED && this.viewStamps[index] !== viewGeneration) return true
    const validTo = this.validTo[index]
    return time < this.validFrom[index] || time > validTo || (playing && time >= validTo)
  }

  set(index: number, state: MotionState, validFrom: number, validTo: number): void {
    this.state[index] = state
    this.validFrom[index] = validFrom
    this.validTo[index] = validTo
  }

  /** Forget every sample; positions and history no longer describe the geometry. */
  invalidate(): void {
    this.state.fill(MOTION_STALE)
    this.validFrom.fill(-Infinity)
    this.validTo.fill(Infinity)
    this.history.invalidate()
  }
}
