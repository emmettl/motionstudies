import type { NetworkTrain } from '@motionstudies/core/domain/network'
import { VehicleHistory } from './vehicle-history.ts'

/**
 * Per-journey sampling state shared by the moving-vehicle layer and train
 * labels. Positions are valid only for journeys placed by the latest pass.
 */
export class VehicleMotionTable {
  readonly index: ReadonlyMap<NetworkTrain, number>
  /** Position at the sampling window start; read only when `placed`. */
  readonly positions: Float32Array
  /** Position at the sampling window end; NaN when the journey had none. */
  readonly targets: Float32Array
  readonly stamps: Uint32Array
  readonly history: VehicleHistory
  generation = 0
  /** Study time the targets describe; NaN until the first pass. */
  targetTime = NaN

  constructor(trains: readonly NetworkTrain[]) {
    this.index = new Map(trains.map((train, index) => [train, index]))
    this.positions = new Float32Array(trains.length * 3)
    this.targets = new Float32Array(trains.length * 3).fill(NaN)
    this.stamps = new Uint32Array(trains.length)
    this.history = new VehicleHistory(trains.length)
  }

  /** Whether the latest pass placed this journey. */
  placed(index: number): boolean {
    return this.stamps[index] === this.generation && this.generation > 0
  }

  /** Whether the previous pass placed this journey. */
  placedBefore(index: number): boolean {
    return this.generation > 1 && this.stamps[index] === this.generation - 1
  }

  /** Forget every sample; positions and history no longer describe the geometry. */
  invalidate(): void {
    this.targets.fill(NaN)
    this.targetTime = NaN
    this.generation = 0
    this.stamps.fill(0)
    this.history.invalidate()
  }
}
