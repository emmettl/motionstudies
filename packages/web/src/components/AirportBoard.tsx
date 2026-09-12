import { useState } from 'react'
import { AirportHeroCard, type AirportHeroCardProps } from './AirportHeroCard.tsx'
import { useAirportFeed } from '../use-airport-feed.ts'
import { useNowClock } from '../use-now-clock.ts'
const defaults = {
  study: 'Study', now: 'Now', checking: 'Checking live availability…', unavailable: 'Live updates unavailable.',
  returnToStudy: 'Return to study', loading: 'Loading current airport board…', updated: 'Retrieved', stale: 'Updates delayed',
  localTime: 'Local time', scheduled: 'Scheduled', revised: 'Revised', note: 'AeroDataBox · Scheduled or revised times as supplied. Revisions may be estimated or actual. All times local. Coverage may be incomplete.',
}
export interface AirportBoardProps {
  readonly studyCard: AirportHeroCardProps
  readonly live: { readonly baseUrl: string; readonly edition: string; readonly airport: string }
  readonly labels?: Partial<typeof defaults>
}
/** Optional live enhancement. Keeps the study clock and recorded flight selection separate. */
export function AirportBoard({ studyCard, live, labels }: AirportBoardProps) {
  const copy = { ...defaults, ...labels }
  const clock = useNowClock((instant) => Math.floor(instant.getTime() / 1000))
  const feed = useAirportFeed(live.baseUrl, live.edition, live.airport, clock.active)
  const [selected, setSelected] = useState<string>()
  const response = feed.response, snapshot = response?.snapshot
  const now = clock.time ?? snapshot?.fetchedAt ?? 0
  const usable = snapshot && snapshot.expiresAt > now && ['fresh', 'stale'].includes(response!.status)
  const stale = usable && (response?.status === 'stale' || now >= snapshot.freshUntil)
  const timeZone = snapshot?.airport.timeZone ?? 'UTC'
  const formatter = new Intl.DateTimeFormat(undefined, { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const formatTime = (time: number) => formatter.format(new Date(time * 1000))
  const dateLabel = new Intl.DateTimeFormat(undefined, { timeZone, day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(now * 1000))
  function stop() { clock.stop(); setSelected(undefined) }
  const selectedFlight = usable ? [...snapshot.departures, ...snapshot.arrivals].find((flight) => flight.id === selected) : undefined
  return <div className="ms-airport-board">
    <div className="ms-airport-board__modes" role="group" aria-label={`${copy.study} / ${copy.now}`}>
      <button type="button" aria-pressed={!clock.active} onClick={stop}>{copy.study}</button>
      <button type="button" aria-pressed={clock.active} disabled={!clock.active && !feed.available} onClick={clock.start}>{copy.now}</button>
      {!clock.active && <span>{feed.checking ? copy.checking : !feed.available ? copy.unavailable : null}</span>}
    </div>
    <div hidden={clock.active}><AirportHeroCard {...studyCard} /></div>
    {clock.active && <>
      {usable ? <>
        <AirportHeroCard key={snapshot.airport.iata} airport={snapshot.airport}
          study={{ time: now, windowStart: snapshot.windowStart, windowEnd: snapshot.windowEnd }}
          departures={snapshot.departures.map((f) => ({ ...f, time: f.revisedTime ?? f.scheduledTime, stand: f.gate }))}
          arrivals={snapshot.arrivals.map((f) => ({ ...f, time: f.revisedTime ?? f.scheduledTime, stand: f.gate }))}
          formatTime={formatTime} dateLabel={dateLabel} labels={{ ...studyCard.labels, studyTime: copy.localTime }}
          maxRows={studyCard.maxRows} horizon={studyCard.horizon} selectedFlightId={selected} onSelectFlight={setSelected}
          note={<><span role="status">{stale ? `${copy.stale} · ` : ''}{copy.updated} {formatTime(snapshot.fetchedAt)} · </span>{copy.note}</>} />
        {selectedFlight && <p className="ms-airport-board__detail">{selectedFlight.service} · {selectedFlight.place ?? '—'} · {selectedFlight.status ?? '—'}
          {selectedFlight.scheduledTime !== undefined && <> · {copy.scheduled} {formatTime(selectedFlight.scheduledTime)}</>}
          {selectedFlight.revisedTime !== undefined && <> · {copy.revised} {formatTime(selectedFlight.revisedTime)}</>}
        </p>}
      </> : <div className="ms-airport-board__unavailable" role="status">
        <p>{feed.loading || feed.checking ? copy.loading : copy.unavailable}</p>
        <button type="button" onClick={stop}>{copy.returnToStudy}</button>
      </div>}
    </>}
  </div>
}
