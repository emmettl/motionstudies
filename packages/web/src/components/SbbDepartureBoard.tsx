import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { RailDeparture } from './RailStationHeroCard.tsx'

interface SbbDepartureBoardProps {
  readonly label: string
  readonly departures: readonly RailDeparture[]
  readonly labels: { departures: string; service: string; time: string; destination: string; platform: string; via: string; loading: string; empty: string }
  readonly lineCount: number | 'auto'
  readonly height: number
  readonly minRowHeight?: number
  readonly loading?: boolean
  readonly clockLabel?: string
  readonly footerLabel?: string
  readonly onSelectDeparture?: (id: string) => void
  readonly selectedDepartureId?: string
}

/** A typographic station board; the surrounding rail hero owns identity and errors. */
export function SbbDepartureBoard({ label, departures, labels, lineCount, height, minRowHeight = 64, loading,
  clockLabel, footerLabel, onSelectDeparture, selectedDepartureId }: SbbDepartureBoardProps) {
  const body = useRef<HTMLDivElement>(null)
  const [availableHeight, setAvailableHeight] = useState(300)
  useEffect(() => {
    const element = body.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setAvailableHeight(Math.floor(entry.contentRect.height)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const targetHeight = Number.isFinite(minRowHeight) ? Math.max(32, Math.min(120, minRowHeight)) : 64
  const requested = lineCount === 'auto' ? Math.floor(availableHeight / targetHeight) : lineCount
  const count = Number.isFinite(requested) ? Math.max(1, Math.min(30, Math.floor(requested))) : 6
  const rowHeight = availableHeight / count
  const message = loading ? labels.loading : departures.length === 0 ? labels.empty : undefined
  return <div className="ms-sbb-board" data-lines={count} style={{ height: Number.isFinite(height) ? Math.max(140, height) : 400,
    '--sbb-row-count': count, '--sbb-font-size': `${Math.max(8, Math.min(24, rowHeight * .38))}px`,
    '--sbb-detail-size': `${Math.max(7, Math.min(13, rowHeight * .22))}px` } as CSSProperties}>
    <div className="ms-sbb-board__title"><strong>{labels.departures}</strong>{clockLabel && <span className="ms-sbb-board__clock">{clockLabel}</span>}</div>
    <div className="ms-sbb-board__table" role="table" aria-label={label} aria-busy={loading || false}>
      <div role="rowgroup"><div className="ms-sbb-board__columns" role="row">
        {[labels.service, labels.time, labels.destination, labels.platform].map((text, index) => <div role="columnheader" key={index}>{text}</div>)}
      </div></div>
      <div className="ms-sbb-board__body" ref={body}>
        <div className="ms-sbb-board__rows" role="rowgroup">{Array.from({ length: count }, (_, index) => {
          const entry = message ? undefined : departures[index]
          const details = entry ? [entry.via ? `${labels.via} ${entry.via}` : '', entry.serviceNote].filter(Boolean).join(' · ') : ''
          return <div className="ms-sbb-board__row" role="row" key={entry?.id ?? `blank-${index}`} aria-hidden={!entry || undefined}
            data-tone={entry?.tone} data-selected={entry && selectedDepartureId === entry.id || undefined}>
            <div role="cell"><span className="ms-sbb-board__service" data-category={entry?.serviceCategory} title={entry?.service}>{entry ? entry.service || '—' : ''}</span></div>
            <div role="cell"><span className="ms-sbb-board__time">{entry ? entry.time || '—' : ''}</span>{entry?.expected && <span className="ms-sbb-board__expected" title={entry.expected}>{entry.expected}</span>}</div>
            <div role="cell">{entry && onSelectDeparture
              ? <button type="button" aria-pressed={selectedDepartureId === entry.id} onClick={() => onSelectDeparture(entry.id)} title={entry.destination}>
                <span className="ms-sbb-board__destination">{entry.destination}</span>{details && <span className="ms-sbb-board__details" title={details}>{details}</span>}
              </button>
              : <><span className="ms-sbb-board__destination" title={entry?.destination}>{entry?.destination}</span>{details && <span className="ms-sbb-board__details" title={details}>{details}</span>}</>}
            </div>
            <div role="cell"><strong className="ms-sbb-board__platform" title={entry?.platform}>{entry ? entry.platform || '—' : ''}</strong>{entry?.platformSector && <span className="ms-sbb-board__sector" title={entry.platformSector}>{entry.platformSector}</span>}</div>
          </div>
        })}</div>
        {message && <div className="ms-sbb-board__message" role="status">{message}</div>}
      </div>
    </div>
    {footerLabel && <div className="ms-sbb-board__footer">{footerLabel}</div>}
  </div>
}
