import { useState } from 'react'
import { sbbDepartures, sbbLabels } from './sbb-fixtures.ts'
import { RailStationHeroCard, type RailDeparture } from '@motionstudies/web/components/RailStationHeroCard'
import { BusStopHeroCard, type BusDeparture } from '@motionstudies/web/components/BusStopHeroCard'
import { AirportHeroCard } from '@motionstudies/web/components/AirportHeroCard'
import '@motionstudies/web/transport-hero-cards.css'
import '@motionstudies/web/airport-hero-card.css'

const trains: readonly RailDeparture[] = [
  { id: 'rail-1', time: '16:56', destination: 'Taunton', platform: '8', expected: 'On time' },
  { id: 'rail-2', time: '17:00', destination: 'London Paddington', platform: '5', expected: 'On time' },
  { id: 'rail-3', time: '17:10', destination: 'Taunton', expected: 'On time', serviceNote: 'Please use the front 5 coaches' },
  { id: 'rail-4', time: '17:15', destination: 'Portsmouth Harbour', platform: '9', expected: '17:22', via: 'Eastleigh' },
  { id: 'rail-5', time: '17:15', destination: 'Cardiff Central', expected: 'Cancelled', tone: 'warning' },
  { id: 'rail-6', time: '17:16', destination: 'Severn Beach', platform: '3', expected: 'On time' },
  { id: 'rail-7', time: '17:25', destination: 'Weston-super-Mare', platform: '6', expected: 'On time' },
]
const buses: readonly BusDeparture[] = [
  { id: 'bus-1', route: '71', destination: 'Northfield Campus', due: 'Due', tone: 'accent' },
  { id: 'bus-2', route: '903', destination: 'Long Ashton P+R', due: '2 min' },
  { id: 'bus-3', route: 'X9', destination: 'Nailsea', due: '7 min', via: 'Long Ashton' },
  { id: 'bus-4', route: 'X6', destination: 'Clevedon', due: '12 min' },
  { id: 'bus-5', route: 'X4', destination: 'Portishead', due: '13 min' },
]

export function TransportHeroStudy() {
  const [transport, setTransport] = useState('rail')
  const [presentation, setPresentation] = useState<'uk-rail' | 'dot-matrix' | 'split-flap' | 'sbb'>('uk-rail')
  const [railExample, setRailExample] = useState('uk')
  const [language, setLanguage] = useState<keyof typeof sbbLabels>('de')
  const [lines, setLines] = useState('10')
  const [height, setHeight] = useState(430)
  const [width, setWidth] = useState(980)
  const [state, setState] = useState('ready')
  const [updated, setUpdated] = useState(false)
  const [long, setLong] = useState(false)
  const [selected, setSelected] = useState<Record<string, string | undefined>>({})
  const select = (id: string) => setSelected((current) => ({ ...current, [transport]: id }))
  const shared = { presentation, lineCount: lines === 'auto' ? 'auto' as const : Number(lines), boardHeight: height,
    loading: state === 'loading', error: state === 'error' ? 'Departure information unavailable.' : undefined, onRetry: () => setState('ready'),
    clockLabel: '16:49:26', footerLabel: 'Study timetable', selectedDepartureId: selected[transport], onSelectDeparture: select,
    note: 'Synthetic timetable · Bristol-inspired fixture. Times and operational messages are examples, not a live service.' }
  return <>
    <div className="toolbar">
      <label>Transport <select value={transport} onChange={(event) => { setTransport(event.target.value); setPresentation(event.target.value === 'rail' ? 'uk-rail' : 'dot-matrix') }}><option value="rail">Rail station</option><option value="bus">Bus stop</option><option value="airport">Airport</option></select></label>
      {transport !== 'airport' && <>
        <label>Hero presentation <select value={presentation} onChange={(event) => { const next = event.target.value as typeof presentation; setPresentation(next); if (next === 'sbb') { setRailExample('sbb'); setLines('6') } }} >{transport === 'rail' && <option value="sbb">SBB departure board</option>}<option value="uk-rail">UK rail matrix</option><option value="dot-matrix">Bus dot matrix</option><option value="split-flap">Split flap</option></select></label>
        <label>Hero lines <select value={lines} onChange={(event) => setLines(event.target.value)}><option value="auto">Fit height</option>{[1, 3, 6, 10, 15].map((count) => <option key={count} value={count}>{count} lines</option>)}</select></label>
        <label>Hero display height <input type="range" min="180" max="640" step="10" value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label>
      </>}
      {transport === 'rail' && <label>Rail example <select value={railExample} onChange={(event) => { setRailExample(event.target.value); setPresentation(event.target.value === 'sbb' ? 'sbb' : 'uk-rail'); setLines(event.target.value === 'sbb' ? '6' : '10') }}><option value="uk">Bristol Temple Meads</option><option value="sbb">Zürich HB · Gleislicht</option></select></label>}
      {transport === 'rail' && railExample === 'sbb' && <label>Board language <select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}><option value="de">Deutsch</option><option value="fr">Français</option><option value="it">Italiano</option><option value="en">English</option></select></label>}
      <label>Hero state <select value={state} onChange={(event) => setState(event.target.value)}><option value="ready">Ready</option><option value="loading">Loading</option><option value="empty">Empty</option><option value="error">Error</option></select></label>
      <button onClick={() => setUpdated(!updated)}>Update departure</button>
      <label><input type="checkbox" checked={long} onChange={(event) => setLong(event.target.checked)} /> Long hero destination</label>
    </div>
    <div className="toolbar" aria-label="Hero size controls">
      <label>Card width <input type="range" min="240" max="980" step="10" value={width} onChange={(event) => setWidth(Number(event.target.value))} /><output>{width}px</output></label>
      {[['Compact', 280], ['Mobile', 360], ['Panel', 600], ['Wide', 980]].map(([name, value]) => <button type="button" key={name} aria-pressed={width === value} onClick={() => setWidth(Number(value))}>{name}</button>)}
    </div>
    <div className="transport-hero-specimen" style={{ width, maxWidth: '100%' }}>
      {transport === 'rail' ? <RailStationHeroCard {...shared} station={railExample === 'sbb' ? { name: 'Zürich HB', locality: 'Zürich' } : { name: 'Bristol Temple Meads', code: 'BRI', locality: 'Bristol' }}
        labels={railExample === 'sbb' ? sbbLabels[language] : undefined}
        note={railExample === 'sbb' ? 'Synthetic timetable · Zürich HB fixture for Gleislicht. Times and operational messages are examples, not a live service.' : shared.note} clockLabel={railExample === 'sbb' ? '09:00:00' : shared.clockLabel}
        departures={state === 'empty' ? [] : (railExample === 'sbb' ? sbbDepartures : trains).map((train, index) => ({ ...train,
          ...(index === 1 && updated ? { expected: railExample === 'sbb' ? '+8 min' : '17:08', tone: 'warning' as const } : {}),
          ...(index === 1 && long ? { destination: railExample === 'sbb' ? 'Genève-Aéroport via Lausanne et Fribourg/Freiburg' : 'London Paddington via Bath Spa and Reading' } : {}) }))} />
        : transport === 'bus' ? <BusStopHeroCard {...shared} presentation={presentation === 'sbb' ? 'dot-matrix' : presentation} stop={{ name: 'Anchor Road', code: 'A1', locality: 'Bristol · City centre' }}
          departures={state === 'empty' ? [] : buses.map((bus, index) => ({ ...bus,
            ...(index === 1 && updated ? { due: '4 min', tone: 'warning' as const } : {}),
            ...(index === 1 && long ? { destination: 'Long Ashton Park & Ride via City Centre' } : {}) }))} />
          : <AirportHeroCard airport={{ name: 'Northfield International', iata: 'NFL', city: 'Northfield' }}
            departures={state === 'empty' ? [] : [{ id: 'flight-1', time: 61200, service: 'NF 204', place: long ? 'Saint-Étienne International — Terminal Nord' : 'Port Azure', stand: 'A12', status: updated ? 'Delayed' : 'On time' }]}
            arrivals={state === 'empty' ? [] : [{ id: 'flight-2', time: 61320, service: 'NF 203', place: 'Port Azure', stand: 'A06', status: 'On time' }]}
            study={{ time: 60566, windowStart: 60000, windowEnd: 64800 }} note="Synthetic timetable · Invented airport and flights."
            loading={shared.loading} error={shared.error} onRetry={shared.onRetry} onSelectFlight={select} selectedFlightId={selected.airport} />}
    </div>
    <output className="airport-selection" data-testid="selected-hero-departure">{selected[transport] ? `Selected departure: ${selected[transport]}` : 'Select a departure to inspect its movement.'}</output>
    <p className="note">Three transport identities, shared display components. Rail puts scheduled time, platform and expected status together; buses lead with route and due time; airports retain flight numbers, gates and direction tabs. Matrix detail lines count towards the chosen line limit. The clock is fixed to the example study time.</p>
  </>
}
