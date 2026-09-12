import { useId, useState, type ReactNode } from 'react'
import { formatServiceTime } from '@motionstudies/core/domain/network'
import { movementBoardWindow, movementsForBoard, type MovementBoardStudy, type MovementBoardHorizon } from '@motionstudies/core/domain/movement-board'
import { SplitFlapBoard, type SplitFlapRow } from './SplitFlapBoard.tsx'

export interface AirportBoardEntry {
  readonly id: string
  /** Movement time in the same seconds as the study clock. Untimed rows are omitted. */
  readonly time?: number
  readonly service: string
  readonly place?: string
  readonly stand?: string
  readonly status?: string
  readonly tone?: SplitFlapRow['tone']
}

const defaultLabels = {
  airport: 'Airport', departures: 'Departures', arrivals: 'Arrivals',
  time: 'Time', service: 'Flight', destination: 'To', origin: 'From', stand: 'Gate', status: 'Remarks',
  emptyDepartures: 'No departures in this window.', emptyArrivals: 'No arrivals in this window.',
  loading: 'Loading airport movements…', retry: 'Retry',
  studyTime: 'Study time', boardWindow: 'Board window', outsideWindow: 'Outside study window',
}

export interface AirportHeroCardProps {
  readonly airport: { readonly iata: string; readonly name: string; readonly city: string }
  readonly departures: readonly AirportBoardEntry[]
  readonly arrivals: readonly AirportBoardEntry[]
  /** Explain the source, study date and whether directions/times are inferred. */
  readonly note: ReactNode
  readonly study: MovementBoardStudy
  readonly horizon?: MovementBoardHorizon
  readonly maxRows?: number
  readonly dateLabel?: string
  readonly formatTime?: (seconds: number) => string
  readonly labels?: Partial<typeof defaultLabels>
  readonly loading?: boolean
  readonly error?: string
  readonly onRetry?: () => void
  readonly onSelectFlight?: (id: string) => void
  readonly selectedFlightId?: string
  readonly initialDirection?: 'departures' | 'arrivals'
  readonly className?: string
}

/** Shared airport selection hero. Supply a key={airport.id} to reset direction on airport changes. */
export function AirportHeroCard({ airport, departures, arrivals, note, study, horizon, maxRows = 8, dateLabel, formatTime = formatServiceTime, labels, loading = false, error, onRetry, onSelectFlight, selectedFlightId, initialDirection = 'departures', className = '' }: AirportHeroCardProps) {
  const [direction, setDirection] = useState(initialDirection)
  const titleId = useId()
  const boardId = useId()
  const copy = { ...defaultLabels, ...labels }
  const window = movementBoardWindow(study, horizon)
  const entries = movementsForBoard(direction === 'departures' ? departures : arrivals, window, maxRows)
  const rows: SplitFlapRow[] = entries.map((entry) => ({ id: entry.id, tone: entry.tone,
    cells: { time: formatTime(entry.time!), service: entry.service, place: entry.place, stand: entry.stand, status: entry.status } }))
  return <section className={`ms-airport-hero ${className}`} aria-labelledby={titleId}>
    <div className="ms-airport-hero__masthead">
      <span className="ms-airport-hero__eyebrow"><span aria-hidden="true">↗</span> {copy.airport} / {airport.city}</span>
      {dateLabel && <span className="ms-airport-hero__date">{dateLabel}</span>}
    </div>
    <div className="ms-airport-hero__identity">
      <strong className="ms-airport-hero__code">{airport.iata}</strong>
      <h2 id={titleId}>{airport.name}</h2>
      <div className="ms-airport-hero__clock">
        <span className="ms-airport-hero__clock-label">{copy.studyTime}</span>{' '}
        <strong className="ms-airport-hero__clock-value">{Number.isFinite(study.time) ? formatTime(study.time) : '—'}</strong>
      </div>
    </div>
    <div className="ms-airport-hero__board-header">
      <div className="ms-airport-hero__directions" role="group" aria-label={`${copy.departures} / ${copy.arrivals}`}>
        {(['departures', 'arrivals'] as const).map((value) => <button type="button" key={value} aria-pressed={direction === value} aria-controls={boardId} onClick={() => setDirection(value)}>
          <span aria-hidden="true">{value === 'departures' ? '↗' : '↘'}</span> {copy[value]}
        </button>)}
      </div>
      <p className="ms-airport-hero__window">{window ? `${copy.boardWindow} ${formatTime(window.start)}–${formatTime(window.end)}` : copy.outsideWindow}</p>
    </div>
    <div id={boardId}>
      {error ? <div className="ms-airport-hero__message" role="status">{error}{onRetry && <button type="button" onClick={onRetry}>{copy.retry}</button>}</div>
        : <SplitFlapBoard label={`${airport.iata} ${copy[direction]}`} columns={[
          { key: 'time', label: copy.time, characters: 5 },
          { key: 'service', label: copy.service, characters: 7 },
          { key: 'place', label: direction === 'departures' ? copy.destination : copy.origin, characters: 18 },
          { key: 'stand', label: copy.stand, characters: 3 },
          { key: 'status', label: copy.status, characters: 11 },
        ]} rows={rows} loading={loading} loadingMessage={copy.loading} loadingRows={rows.length || Math.min(maxRows, 5)} emptyMessage={direction === 'departures' ? copy.emptyDepartures : copy.emptyArrivals}
          selectionColumn="service" onSelectRow={onSelectFlight} selectedRowId={selectedFlightId} />}
    </div>
    <div className="ms-airport-hero__note">{note}</div>
  </section>
}
