import { useId } from 'react'
import type { DotMatrixRow } from './DotMatrixBoard.tsx'
import { TransportHeroBoard, type TransportHeroOptions } from './TransportHeroBoard.tsx'

export interface BusDeparture {
  readonly id: string
  readonly route: string
  readonly destination: string
  /** Consumer-formatted estimate or scheduled time; missing values stay unknown. */
  readonly due?: string
  readonly via?: string
  readonly tone?: DotMatrixRow['tone']
}

const defaultLabels = { departures: 'Bus departures from', route: 'Route', destination: 'Destination', due: 'Due', stop: 'Stop',
  via: 'via', loading: 'Loading bus departures…', empty: 'No buses expected.', retry: 'Retry', detail: 'Information' }

export interface BusStopHeroCardProps extends TransportHeroOptions {
  readonly stop: { readonly name: string; readonly code?: string; readonly locality?: string }
  readonly departures: readonly BusDeparture[]
  readonly labels?: Partial<typeof defaultLabels>
  readonly onSelectDeparture?: (id: string) => void
  readonly selectedDepartureId?: string
}

/** Local stop identity and route-first arrival estimates. The consumer owns ordering. */
export function BusStopHeroCard({ stop, departures, labels, presentation = 'dot-matrix', lineCount = 6, boardHeight = 360,
  minRowHeight, clockLabel, footerLabel, note, loading, error, onRetry, onSelectDeparture, selectedDepartureId, className = '' }: BusStopHeroCardProps) {
  const titleId = useId()
  const copy = { ...defaultLabels, ...labels }
  return <section className={`ms-bus-stop-hero ${className}`} aria-labelledby={titleId}>
    <div className="ms-bus-stop-hero__identity">
      <span className="ms-bus-stop-hero__symbol" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="7" y="4" width="18" height="23" rx="4" /><path d="M7 17h18M11 8h10M10 27v3m12-3v3" /><circle cx="11" cy="22" r="1" /><circle cx="21" cy="22" r="1" /></svg></span>
      <div><p>{copy.departures}</p><h2 id={titleId}>{stop.name}</h2>{stop.locality && <p>{stop.locality}</p>}</div>
      {stop.code && <div className="ms-bus-stop-hero__code"><span>{copy.stop}</span><strong>{stop.code}</strong></div>}
    </div>
    <TransportHeroBoard label={`${stop.name} bus departures`} presentation={presentation} boardHeight={boardHeight}
      columns={[{ key: 'route', label: copy.route, characters: 4, minCharacters: 4 },
        { key: 'destination', label: copy.destination, characters: 24, minCharacters: 5 },
        { key: 'due', label: copy.due, characters: 6, minCharacters: 6, align: 'right' }]}
      rows={departures.map((entry) => ({ id: entry.id, tone: entry.tone, note: entry.via ? `${copy.via} ${entry.via}` : undefined,
        cells: { route: entry.route, destination: entry.destination, due: entry.due } }))}
      lineCount={lineCount} minRowHeight={minRowHeight} clockLabel={clockLabel} footerLabel={footerLabel}
      loading={loading} loadingMessage={copy.loading} emptyMessage={copy.empty} error={error} onRetry={onRetry} retryLabel={copy.retry} detailLabel={copy.detail}
      onSelectRow={onSelectDeparture} selectedRowId={selectedDepartureId} selectionColumn="route" />
    <div className="ms-transport-hero__note">{note}</div>
  </section>
}
