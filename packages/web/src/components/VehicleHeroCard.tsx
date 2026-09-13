import { useId, type ReactNode } from 'react'

export type VehicleHeroPresentation = 'uk-bus' | 'uk-rail' | 'yellow-bus' | 'sbb'

export interface VehicleCallingPoint {
  readonly id: string
  readonly name: string
  /** Consumer-formatted arrival time or estimate. Omit when unknown. */
  readonly time?: string
  readonly platform?: string
  readonly detail?: string
  /** Set only for a confirmed destination, never just the end of a data chunk. */
  readonly isDestination?: boolean
}

const defaultLabels = {
  bus: 'Bus', rail: 'Train', destination: 'Destination', destinationUnknown: 'Destination unavailable',
  nextStop: 'Next stop', callingAt: 'Then calling at', terminus: 'Destination', platform: 'Platform',
  loading: 'Loading upcoming stops…', empty: 'No upcoming stops available.', retry: 'Retry',
}

export interface VehicleHeroCardProps {
  readonly vehicle: { readonly service: string; readonly destination?: string; readonly operator?: string; readonly description?: string }
  /** Remaining calls in journey order, starting with the next stop. The consumer owns playback/filtering. */
  readonly stops: readonly VehicleCallingPoint[]
  readonly presentation?: VehicleHeroPresentation
  /** Explicit source/freshness explanation. */
  readonly note: ReactNode
  readonly status?: string
  readonly statusTone?: 'neutral' | 'warning'
  readonly clockLabel?: string
  readonly labels?: Partial<typeof defaultLabels>
  readonly loading?: boolean
  readonly error?: string
  readonly onRetry?: () => void
  readonly onSelectStop?: (id: string) => void
  readonly selectedStopId?: string
  readonly className?: string
}

/** An onboard view of one vehicle; no destination, timing or operational status is inferred. */
export function VehicleHeroCard({ vehicle, stops, presentation = 'uk-rail', note, status, statusTone = 'neutral',
  clockLabel, labels, loading, error, onRetry, onSelectStop, selectedStopId, className = '' }: VehicleHeroCardProps) {
  const titleId = useId()
  const copy = { ...defaultLabels, ...labels }
  const bus = presentation === 'uk-bus' || presentation === 'yellow-bus'
  const [next, ...following] = stops
  const stopContent = (stop: VehicleCallingPoint) => <>
    <span className="ms-vehicle-hero__stop-name">{stop.name}
      {stop.isDestination && <small>{copy.terminus}</small>}
      {stop.detail && <span className="ms-vehicle-hero__detail">{stop.detail}</span>}
    </span>
    {(stop.time || stop.platform) && <span className="ms-vehicle-hero__timing">
      {stop.time && <strong>{stop.time}</strong>}
      {stop.platform && <small>{copy.platform} {stop.platform}</small>}
    </span>}
  </>
  const renderStop = (stop: VehicleCallingPoint) => onSelectStop
    ? <button type="button" className="ms-vehicle-hero__stop" aria-pressed={selectedStopId === stop.id} onClick={() => onSelectStop(stop.id)}>{stopContent(stop)}</button>
    : <div className="ms-vehicle-hero__stop">{stopContent(stop)}</div>

  return <section className={`ms-vehicle-hero ${className}`} data-presentation={presentation} aria-labelledby={titleId} aria-busy={loading || undefined}>
    <div className="ms-vehicle-hero__masthead"><span>{bus ? copy.bus : copy.rail}{vehicle.operator ? ` · ${vehicle.operator}` : ''}</span>{clockLabel && <span>{clockLabel}</span>}</div>
    <div className="ms-vehicle-hero__identity">
      <strong className="ms-vehicle-hero__service">{vehicle.service}</strong>
      <div><p className="ms-vehicle-hero__eyebrow">{copy.destination}</p><h2 id={titleId}>{vehicle.destination || copy.destinationUnknown}</h2>
        {vehicle.description && <p className="ms-vehicle-hero__description">{vehicle.description}</p>}
      </div>
    </div>
    {status && <div className="ms-vehicle-hero__status" data-tone={statusTone}>{status}</div>}
    {error ? <div className="ms-vehicle-hero__message" role="status">{error}{onRetry && <button type="button" onClick={onRetry}>{copy.retry}</button>}</div>
      : loading ? <div className="ms-vehicle-hero__message" role="status">{copy.loading}</div>
      : next ? <div className="ms-vehicle-hero__journey">
        <div className="ms-vehicle-hero__next"><p className="ms-vehicle-hero__eyebrow">{copy.nextStop}</p>{renderStop(next)}</div>
        {following.length > 0 && <div className="ms-vehicle-hero__following"><p className="ms-vehicle-hero__eyebrow">{copy.callingAt}</p>
          <ol>{following.map((stop) => <li key={stop.id} data-terminus={stop.isDestination || undefined}>{renderStop(stop)}</li>)}</ol>
        </div>}
      </div> : <div className="ms-vehicle-hero__message" role="status">{copy.empty}</div>}
    <div className="ms-vehicle-hero__note">{note}</div>
  </section>
}
