import type { NetworkSnapshot, ServiceCategory } from './network.ts'

export interface StationDeparture {
  readonly id: string
  readonly trainId: string
  /** Time from the supplied snapshot: realtime-adjusted snapshots contain adjusted times. */
  readonly time: number
  readonly service: string
  readonly category: ServiceCategory
  readonly destination: string
  readonly platform?: string
  readonly via: readonly string[]
  readonly status: 'scheduled' | 'adjusted' | 'cancelled'
}

/** Resolve the station against this snapshot, retaining repeat calls but excluding terminators. */
export function stationDepartures(snapshot: NetworkSnapshot, stationName: string): readonly StationDeparture[] {
  const stopIndexes = new Set<number>()
  snapshot.stops.forEach((stop, index) => { if (stop[2] === stationName) stopIndexes.add(index) })
  if (!stopIndexes.size) return []
  const departures: StationDeparture[] = []
  for (const train of snapshot.trains) {
    train.stops.forEach(([stopIndex, , departure], callIndex) => {
      if (!stopIndexes.has(stopIndex) || !Number.isFinite(departure) || callIndex === train.stops.length - 1) return
      const onward = train.stops.slice(callIndex + 1).map(([index]) => snapshot.stops[index]?.[2]).filter((name): name is string => Boolean(name))
      if (!onward.length) return
      const destination = train.headsign.trim() || onward.at(-1)!
      departures.push({ id: `${train.id}:${callIndex}`, trainId: train.id, time: departure,
        service: train.route || train.shortName, category: train.category, destination,
        platform: snapshot.stops[stopIndex]?.[3]?.trim() || undefined,
        via: [...new Set(onward.slice(0, -1).filter((name) => name !== stationName && name !== destination))].slice(0, 3),
        status: train.realtime?.status ?? 'scheduled' })
    })
  }
  return departures.sort((a, b) => a.time - b.time || a.id.localeCompare(b.id))
}
