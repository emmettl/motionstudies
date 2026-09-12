import { useId } from 'react'
import type { DotMatrixRow } from './DotMatrixBoard.tsx'
import { TransportHeroBoard, type TransportHeroOptions } from './TransportHeroBoard.tsx'
import { SbbDepartureBoard } from './SbbDepartureBoard.tsx'

export interface RailDeparture {
  readonly id: string
  /** Consumer-formatted scheduled departure time. */
  readonly time?: string
  readonly destination: string
  readonly platform?: string
  readonly platformSector?: string
  readonly service?: string
  readonly serviceCategory?: 'intercity' | 'international' | 'regional' | 'suburban'
  /** Consumer-formatted expected time or status, e.g. "17:08" or "Cancelled". */
  readonly expected?: string
  readonly via?: string
  readonly serviceNote?: string
  readonly tone?: DotMatrixRow['tone']
}

const defaultLabels = { station: 'Rail station', departures: 'Departures', service: 'Train', time: 'Time', destination: 'Destination', platform: 'Plat', expected: 'Expt',
  via: 'via', loading: 'Loading rail departures…', empty: 'No trains expected.', retry: 'Retry', detail: 'Information' }

export interface RailStationHeroCardProps extends Omit<TransportHeroOptions, 'presentation'> {
  readonly presentation?: TransportHeroOptions['presentation'] | 'sbb'
  readonly station: { readonly name: string; readonly code?: string; readonly locality?: string }
  readonly departures: readonly RailDeparture[]
  readonly labels?: Partial<typeof defaultLabels>
  readonly onSelectDeparture?: (id: string) => void
  readonly selectedDepartureId?: string
}

/** Station identity with time, destination, platform, expected status and service details. */
export function RailStationHeroCard({ station, departures, labels, presentation = 'uk-rail', lineCount = 8, boardHeight = 400,
  minRowHeight, clockLabel, footerLabel, note, loading, error, onRetry, onSelectDeparture, selectedDepartureId, className = '' }: RailStationHeroCardProps) {
  const titleId = useId()
  const sbb = presentation === 'sbb'
  const copy = { ...defaultLabels, ...(sbb ? { platform: 'Platform' } : {}), ...labels }
  return <section className={`ms-rail-station-hero ${className}`} data-presentation={presentation} aria-labelledby={titleId}>
    <div className="ms-rail-station-hero__masthead"><span>{copy.station}{station.locality ? ` / ${station.locality}` : ''}</span>{station.code && <strong>{station.code}</strong>}</div>
    <div className="ms-rail-station-hero__identity"><span aria-hidden="true">{sbb ? <svg viewBox="0 0 40 32"><rect x="10" y="3" width="20" height="22" rx="4" /><path d="M10 15h20M15 25l-4 5m14-5 4 5" /><circle cx="15" cy="20" r="1" /><circle cx="25" cy="20" r="1" /></svg> : <svg viewBox="0 0 40 32"><path d="M3 10h31L23 3M37 22H6l11 7M10 16h20" /></svg>}</span><h2 id={titleId}>{station.name}</h2></div>
    {sbb ? error ? <div className="ms-transport-hero__error" role="status">{error}{onRetry && <button type="button" onClick={onRetry}>{copy.retry}</button>}</div>
      : <SbbDepartureBoard label={`${station.name} ${copy.departures}`} departures={departures} labels={copy} lineCount={lineCount} height={boardHeight}
        minRowHeight={minRowHeight} loading={loading} clockLabel={clockLabel} footerLabel={footerLabel} onSelectDeparture={onSelectDeparture} selectedDepartureId={selectedDepartureId} />
      : <TransportHeroBoard label={`${station.name} ${copy.departures}`} presentation={presentation} boardHeight={boardHeight}
      heading={copy.departures} headingColumnSpan={2}
      columns={[{ key: 'time', label: copy.time, characters: 5, minCharacters: 5 },
        { key: 'destination', label: copy.destination, characters: 24, minCharacters: 5 },
        { key: 'platform', label: copy.platform, characters: 3, minCharacters: 2, align: 'right' },
        { key: 'expected', label: copy.expected, characters: 9, minCharacters: 9, align: 'right' }]}
      rows={departures.map((entry) => ({ id: entry.id, tone: entry.tone,
        note: [entry.via ? `${copy.via} ${entry.via}` : '', entry.serviceNote].filter(Boolean).join(' · ') || undefined,
        cells: { time: entry.time, destination: entry.destination, platform: entry.platform, expected: entry.expected } }))}
      lineCount={lineCount} minRowHeight={minRowHeight} clockLabel={clockLabel} footerLabel={footerLabel}
      loading={loading} loadingMessage={copy.loading} emptyMessage={copy.empty} error={error} onRetry={onRetry} retryLabel={copy.retry} detailLabel={copy.detail}
      onSelectRow={onSelectDeparture} selectedRowId={selectedDepartureId} selectionColumn="destination" />}
    <div className="ms-transport-hero__note">{note}</div>
  </section>
}
