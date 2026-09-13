import { useMemo } from 'react'
import { formatServiceTime, type NetworkSnapshot, type NetworkTrain } from '@motionstudies/core/domain/network'
import { vehicleCalls } from '@motionstudies/core/domain/vehicle-calls'
import { VehicleHeroCard, type VehicleHeroCardProps } from './VehicleHeroCard.tsx'

export interface NetworkVehicleHeroCardProps extends Omit<VehicleHeroCardProps, 'vehicle' | 'stops'> {
  readonly snapshot: NetworkSnapshot
  readonly train: NetworkTrain
  readonly time: number
  /** Hide clock values for frequency-based or otherwise approximate motion. */
  readonly showTimes?: boolean
  readonly atStopLabel?: string
  readonly formatTime?: (time: number) => string
}

/** Resolve the selected ID against the current chunk; never reuse stale stop indexes. */
export function NetworkVehicleHeroCard({ snapshot, train, time, showTimes = true, atStopLabel = 'At stop',
  formatTime = (value) => formatServiceTime(value).slice(0, 5), ...props }: NetworkVehicleHeroCardProps) {
  const current = useMemo(() => snapshot.trains.find(entry => entry.id === train.id), [snapshot, train.id])
  const calls = current ? vehicleCalls(snapshot, current, time) : []
  const identity = current ?? train
  return <VehicleHeroCard {...props} vehicle={{ service: identity.route || identity.shortName,
    destination: identity.headsign.trim() || undefined }}
    labels={{ ...props.labels, ...(calls[0]?.atStop ? { nextStop: atStopLabel } : {}) }}
    stops={calls.map(call => ({ ...call, time: showTimes ? formatTime(call.time) : undefined }))} />
}
