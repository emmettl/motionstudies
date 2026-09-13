import { useState, type CSSProperties } from 'react'
import { AirportHeroCard } from '@motionstudies/web/components/AirportHeroCard'
import '@motionstudies/web/airport-hero-card.css'
import '@motionstudies/web/study-layout.css'
import './panel-layout-study.css'

export function PanelLayoutStudy() {
  const [compact, setCompact] = useState(true)
  const [quiet, setQuiet] = useState(false)
  const [height, setHeight] = useState(540)
  const [width, setWidth] = useState(680)
  return <>
    <div className="toolbar">
      <label><input type="checkbox" checked={compact} onChange={event => setCompact(event.target.checked)} /> Compact airport</label>
      <label><input type="checkbox" checked={quiet} onChange={event => setQuiet(event.target.checked)} /> Hide chrome</label>
      <label>Panel viewport height <input type="number" value={height} min="300" max="900" onChange={event => setHeight(Number(event.target.value))} /></label>
      <label>Panel viewport width <input type="number" value={width} min="280" max="1000" onChange={event => setWidth(Number(event.target.value))} /></label>
    </div>
    <div className="panel-layout-specimen ms-study-layout" data-ms-chrome={quiet ? 'hidden' : undefined} style={{ width, height } as CSSProperties}>
      <div className="panel-layout-header ms-control-group"><button className="ms-control" aria-pressed="true">Map</button><button className="ms-control" disabled>Unavailable</button></div>
      <AirportHeroCard className="ms-study-panel" density={compact ? 'compact' : undefined}
        airport={{ iata: 'SYN', name: 'A deliberately long synthetic airport name', city: 'Fixture' }}
        departures={Array.from({ length: 8 }, (_, index) => ({ id: String(index), time: 60 + index * 30, service: `LAB${index}`, place: 'Synthetic destination' }))}
        arrivals={[]} study={{ time: 60, windowStart: 0, windowEnd: 600 }} maxRows={8} onSelectFlight={() => {}}
        note={<a href="#panel-evidence">Synthetic source evidence remains reachable at the bottom of the scrollable panel.</a>} />
      <div className="panel-layout-footer"><button className="ms-control" id="panel-evidence">Playback</button></div>
    </div>
  </>
}
