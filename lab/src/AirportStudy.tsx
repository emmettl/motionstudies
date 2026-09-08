import { useEffect, useRef, useState } from 'react'
import { formatServiceTime } from '@motionstudies/core/domain/network'
import { movementBoardWindow, movementsForBoard } from '@motionstudies/core/domain/movement-board'
import { AirportHeroCard, type AirportBoardEntry } from '@motionstudies/web/components/AirportHeroCard'
import { SplitFlapBoard } from '@motionstudies/web/components/SplitFlapBoard'
import '@motionstudies/web/airport-hero-card.css'

const departures: readonly AirportBoardEntry[] = [
  { id: 'nf204', time: 31200, service: 'NF 204', place: 'Port Azure', stand: 'A12', status: 'On time', tone: 'accent' },
  { id: 'sa118', time: 32100, service: 'SA 118', place: 'Westhaven', stand: 'B04', status: 'On time' },
  { id: 'nf612', time: 33000, service: 'NF 612', place: 'Montclair', stand: 'A08', status: 'On time' },
  { id: 'ea037', time: 33900, service: 'EA 037', place: 'Eastmere', stand: 'C02', status: 'Delayed', tone: 'warning' },
  { id: 'sa402', time: 35100, service: 'SA 402', place: 'Solhaven', stand: 'B11', status: 'On time' },
  { id: 'early', time: 30000, service: 'NF 100', place: 'North Quay' },
  { id: 'late', time: 36900, service: 'NF 900', place: 'North Quay' },
  { id: 'untimed', service: 'NF 000', place: 'Unknown observation time' },
]
const arrivals: readonly AirportBoardEntry[] = [
  { id: 'nf203', time: 30900, service: 'NF 203', place: 'Port Azure', stand: 'A06', status: 'On time', tone: 'accent' },
  { id: 'ea036', time: 31800, service: 'EA 036', place: 'Eastmere', stand: 'C01', status: 'On time' },
  { id: 'sa117', time: 32700, service: 'SA 117', place: 'Westhaven', status: 'On time' },
]
const railMovements = [
  { id: 'rail1', time: 31320, service: 'RE 12', destination: 'North Quay', platform: '4' },
  { id: 'rail2', time: 31680, service: 'IC 8', destination: 'Grand Junction', platform: '2' },
]

export function AirportStudy() {
  const [state, setState] = useState('ready')
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(reloadTimer.current), [])
  function changeBoardState(next: string) {
    clearTimeout(reloadTimer.current)
    reloadTimer.current = undefined
    setState(next)
  }
  function reloadBoard() {
    changeBoardState('loading')
    reloadTimer.current = setTimeout(() => { reloadTimer.current = undefined; setState('ready') }, 1400)
  }
  const [updated, setUpdated] = useState(false)
  const [long, setLong] = useState(false)
  const [selected, setSelected] = useState<string>()
  const [french, setFrench] = useState(false)
  const [observed, setObserved] = useState(false)
  const [time, setTime] = useState(30720)
  const [windowEnd, setWindowEnd] = useState(36000)
  const [ahead, setAhead] = useState(3600)
  const [playing, setPlaying] = useState(false)
  const atEnd = time >= windowEnd
  const study = { time, windowStart: 30600, windowEnd }
  const horizon = { lookAheadSeconds: ahead }
  const window = movementBoardWindow(study, horizon)
  useEffect(() => {
    if (!playing || atEnd) return
    const timer = setInterval(() => setTime((current) => Math.min(current + 30, windowEnd)), 250)
    return () => clearInterval(timer)
  }, [playing, windowEnd, atEnd])
  const departureRows = departures.map((entry, index) => ({ ...entry,
    place: long && index === 0 ? 'Saint-Étienne International — Terminal Nord' : entry.place,
    ...(updated && index === 1 ? { time: 33300, status: 'Delayed', tone: 'warning' as const } : {}),
    ...(observed ? { place: undefined, stand: undefined, status: 'Inferred' } : {}),
  }))
  const arrivalRows = observed ? arrivals.map((entry) => ({ ...entry, place: undefined, stand: undefined, status: 'Inferred' })) : arrivals
  return <>
    <div className="toolbar">
      <button onClick={() => { if (time >= windowEnd) setTime(study.windowStart); setPlaying(time >= windowEnd || !playing) }}>{playing && time < windowEnd ? 'Pause study' : 'Play study'}</button>
      <label>Study window <select value={windowEnd} onChange={(event) => { const end = Number(event.target.value); setWindowEnd(end); setTime((current) => Math.min(current, end)) }}><option value="36000">08:30–10:00</option><option value="32400">08:30–09:00</option></select></label>
      <label>Look ahead <select value={ahead} onChange={(event) => setAhead(Number(event.target.value))}><option value="1800">30 minutes</option><option value="3600">60 minutes</option><option value="7200">120 minutes</option></select></label>
    </div>
    <div className="timeline airport-study-timeline"><label>Study time <input aria-label="Airport study time" type="range" min={study.windowStart} max={windowEnd} step="60" value={time} onChange={(event) => setTime(Number(event.target.value))} /></label><output data-testid="airport-study-time">{formatServiceTime(time)}</output></div>
    <div className="toolbar">
      <label>Board state <select value={state} onChange={(event) => changeBoardState(event.target.value)}><option value="ready">Ready</option><option value="empty">Empty</option><option value="loading">Loading</option><option value="error">Error</option></select></label>
      <button onClick={reloadBoard}>Reload board</button>
      <button onClick={() => setUpdated(!updated)}>Update flight</button>
      <label><input type="checkbox" checked={long} onChange={(event) => setLong(event.target.checked)} /> Long destination</label>
      <label><input type="checkbox" checked={french} onChange={(event) => setFrench(event.target.checked)} /> French labels</label>
      <label><input type="checkbox" checked={observed} onChange={(event) => setObserved(event.target.checked)} /> Observed tracks only</label>
    </div>
    <div className="airport-specimen">
      <AirportHeroCard airport={{ iata: 'NFL', name: 'Northfield International', city: 'Northfield' }}
        departures={state === 'empty' ? [] : departureRows} arrivals={state === 'empty' ? [] : arrivalRows}
        study={study} horizon={horizon} dateLabel="08 SEP 2026"
        loading={state === 'loading'} error={state === 'error' ? 'Airport movements unavailable.' : undefined}
        onRetry={() => changeBoardState('ready')} onSelectFlight={setSelected} selectedFlightId={selected}
        labels={french ? { airport: 'Aéroport', departures: 'Départs', arrivals: 'Arrivées', time: 'Heure', service: 'Vol', destination: 'Vers', origin: 'De', stand: 'Porte', status: 'Remarques', emptyDepartures: 'Aucun départ dans cette période.', emptyArrivals: 'Aucune arrivée dans cette période.', loading: 'Chargement des mouvements…', retry: 'Réessayer', studyTime: 'Heure de l’étude', boardWindow: 'Période affichée', outsideWindow: 'Hors période de l’étude' } : undefined}
        note={observed ? 'Synthetic observed-track example · Directions inferred from approach traces. Times are observations; destinations and gates are unavailable.' : 'Synthetic timetable · Invented airport, flights and destinations. All times local.'} />
    </div>
    <output className="airport-selection" data-testid="selected-flight">{selected ? `Selected flight: ${selected}` : 'Select a flight number to inspect its movement.'}</output>
    <p className="note">Scrub or play the study at 120× speed. Both airport directions and the rail board follow this clock, keeping the last 10 minutes and upcoming movements inside the selected study window. On narrow screens, scroll within the board to read every column.</p>
    <div className="airport-specimen">
      <SplitFlapBoard label="Junction departures" columns={[
        { key: 'time', label: 'Time', characters: 5 }, { key: 'service', label: 'Train', characters: 7 },
        { key: 'destination', label: 'Destination', characters: 16 }, { key: 'platform', label: 'Platform', characters: 3 },
      ]} rows={movementsForBoard(railMovements, window).map((entry) => ({ id: entry.id, cells: { ...entry, time: formatServiceTime(entry.time) } }))} />
    </div>
  </>
}
