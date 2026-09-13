import type { NetworkSnapshot, NetworkTrain } from './network.ts'

export interface VehicleCall {
  readonly id: string
  readonly name: string
  readonly time: number
  readonly platform?: string
  readonly atStop: boolean
  readonly isDestination: boolean
}

/** Remaining calls from this snapshot's train. Times may already include realtime adjustments. */
export function vehicleCalls(snapshot: NetworkSnapshot, train: NetworkTrain, time: number): readonly VehicleCall[] {
  if (!Number.isFinite(time) || train.realtime?.status === 'cancelled') return []
  return train.stops.flatMap(([index, arrival, departure], callIndex) => {
    const stop = snapshot.stops[index]
    if (!stop || !Number.isFinite(arrival) || !Number.isFinite(departure) || departure < arrival || departure < time) return []
    const atStop = arrival <= time && time <= departure
    return [{ id: `${train.id}:${callIndex}`, name: stop[2], time: atStop ? departure : arrival,
      platform: stop[3]?.trim() || undefined, atStop,
      isDestination: callIndex === train.stops.length - 1 && Boolean(train.headsign.trim()) && stop[2].trim() === train.headsign.trim() }]
  })
}
