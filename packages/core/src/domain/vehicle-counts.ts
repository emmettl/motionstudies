import type { NetworkSnapshot, NetworkTrain, ServiceCategory, StationIndexEntry } from './network.ts'

export function countableVehicleTrains(network: NetworkSnapshot | undefined,
  stations: readonly StationIndexEntry[], selection: {
    category?: ServiceCategory
    station?: Pick<StationIndexEntry, 'name'>
    route?: { name: string; category: ServiceCategory }
  }): readonly NetworkTrain[] {
  const stationTrainIds = selection.station
    ? new Set(stations.find(station => station.name === selection.station?.name)?.trainIds ?? [])
    : undefined
  return network?.trains.filter(train =>
    (!selection.category || train.category === selection.category) &&
    (!stationTrainIds || stationTrainIds.has(train.id)) &&
    (!selection.route || (train.route === selection.route.name && train.category === selection.route.category)),
  ) ?? []
}

/** Build once per immutable selection; clock updates need only two binary searches. */
export function createActiveTimetableVehicleCounter(trains: readonly NetworkTrain[], options: { readonly requirePositionable?: boolean } = {}): (time: number) => number {
  const starts: number[] = [], ends: number[] = []
  for (const train of trains) {
    if (train.realtime?.status === 'cancelled' || (options.requirePositionable && train.stops.length < 2) || !(train.start <= train.end)) continue
    starts.push(train.start)
    ends.push(train.end)
  }
  starts.sort((a, b) => a - b)
  ends.sort((a, b) => a - b)
  const before = (values: readonly number[], time: number, inclusive: boolean): number => {
    let low = 0, high = values.length
    while (low < high) {
      const middle = (low + high) >>> 1
      if (values[middle] < time || inclusive && values[middle] === time) low = middle + 1
      else high = middle
    }
    return low
  }
  // Include both departure and arrival instants, including zero-length trips.
  return time => Number.isNaN(time) ? 0 : before(starts, time, true) - before(ends, time, false)
}

