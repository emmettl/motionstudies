import { useState } from 'react'
import { VehicleHeroCard, type VehicleCallingPoint, type VehicleHeroPresentation } from '@motionstudies/web/components/VehicleHeroCard'
import '@motionstudies/web/vehicle-hero-card.css'

const examples: Record<VehicleHeroPresentation, { label: string; service: string; destination: string; operator: string; stops: readonly VehicleCallingPoint[] }> = {
  'uk-rail': { label: 'UK rail', service: '1A24', destination: 'London Paddington', operator: 'Great Western Railway', stops: [
    { id: 'bath', name: 'Bath Spa', time: '17:12', platform: '2' },
    { id: 'chippenham', name: 'Chippenham', time: '17:24' },
    { id: 'swindon', name: 'Swindon', time: '17:42' },
    { id: 'reading', name: 'Reading', time: '18:08' },
    { id: 'paddington', name: 'London Paddington', time: '18:36', isDestination: true },
  ] },
  'uk-bus': { label: 'UK bus', service: 'X9', destination: 'Nailsea', operator: 'West of England', stops: [
    { id: 'ashton', name: 'Ashton Gate', time: '2 min' },
    { id: 'long-ashton', name: 'Long Ashton', time: '8 min' },
    { id: 'flax', name: 'Flax Bourton', time: '14 min' },
    { id: 'nailsea', name: 'Nailsea', time: '23 min', isDestination: true },
  ] },
  sbb: { label: 'SBB rail', service: 'IC 1', destination: 'Genève-Aéroport', operator: 'SBB CFF FFS', stops: [
    { id: 'bern', name: 'Bern', time: '10:28', platform: '6' },
    { id: 'fribourg', name: 'Fribourg/Freiburg', time: '10:56' },
    { id: 'lausanne', name: 'Lausanne', time: '11:42' },
    { id: 'geneve', name: 'Genève', time: '12:18' },
    { id: 'airport', name: 'Genève-Aéroport', time: '12:27', isDestination: true },
  ] },
  'yellow-bus': { label: 'Swiss bus', service: '331', destination: 'Rapperswil SG, Bahnhof', operator: 'Regionalbus · Schweiz', stops: [
    { id: 'ruti', name: 'Rüti ZH, Bahnhof', time: '14:06' },
    { id: 'bubikon', name: 'Bubikon, Dorf', time: '14:14' },
    { id: 'jona', name: 'Jona, Buechstrasse', time: '14:25' },
    { id: 'rapperswil', name: 'Rapperswil SG, Bahnhof', time: '14:32', isDestination: true },
  ] },
}
const german = { bus: 'Bus', rail: 'Zug', destination: 'Nach', destinationUnknown: 'Ziel nicht verfügbar', nextStop: 'Nächster Halt',
  callingAt: 'Weitere Halte', terminus: 'Endstation', platform: 'Gleis', loading: 'Halte werden geladen…', empty: 'Keine weiteren Halte verfügbar.', retry: 'Erneut versuchen' }

export function VehicleHeroStudy() {
  const [presentation, setPresentation] = useState<VehicleHeroPresentation>('sbb')
  const [step, setStep] = useState(0)
  const [state, setState] = useState('ready')
  const [unknown, setUnknown] = useState(false)
  const [missingTimes, setMissingTimes] = useState(false)
  const [long, setLong] = useState(false)
  const [delayed, setDelayed] = useState(false)
  const [language, setLanguage] = useState('en')
  const [width, setWidth] = useState(600)
  const [selected, setSelected] = useState<string>()
  const example = examples[presentation]
  const stops = example.stops.slice(step).map((stop, index) => ({ ...stop,
    ...(unknown ? { isDestination: false } : {}),
    ...(missingTimes ? { time: undefined, platform: undefined } : {}),
    ...(long && index === 0 ? { name: 'Fribourg/Freiburg — Université, Bibliothèque cantonale et universitaire' } : {}),
  }))
  return <>
    <p className="vehicle-study-intro">One vehicle. The next stop, then the journey ahead.</p>
    <div className="toolbar">
      <label>Vehicle presentation <select value={presentation} onChange={(event) => { setPresentation(event.target.value as VehicleHeroPresentation); setStep(0); setSelected(undefined) }}>
        {Object.entries(examples).map(([value, entry]) => <option key={value} value={value}>{entry.label}</option>)}
      </select></label>
      <label>Vehicle language <select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="en">English</option><option value="de">Deutsch</option></select></label>
      <label>Vehicle state <select value={state} onChange={(event) => setState(event.target.value)}>{['ready', 'loading', 'empty', 'error'].map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className="toolbar">
      <label><input type="checkbox" checked={unknown} onChange={(event) => setUnknown(event.target.checked)} /> Unknown destination</label>
      <label><input type="checkbox" checked={missingTimes} onChange={(event) => setMissingTimes(event.target.checked)} /> Missing times</label>
      <label><input type="checkbox" checked={long} onChange={(event) => setLong(event.target.checked)} /> Long stop name</label>
      <label><input type="checkbox" checked={delayed} onChange={(event) => setDelayed(event.target.checked)} /> Disruption</label>
    </div>
    <div className="toolbar">
      <button type="button" disabled={step >= example.stops.length} onClick={() => setStep(step + 1)}>Advance one stop</button>
      <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>Previous stop</button>
      <label>Vehicle card width <input type="range" min="240" max="900" step="10" value={width} onChange={(event) => setWidth(Number(event.target.value))} /><output>{width}px</output></label>
    </div>
    <div style={{ width, maxWidth: '100%' }}>
      <VehicleHeroCard presentation={presentation} vehicle={{ service: example.service, operator: example.operator, destination: unknown ? undefined : example.destination }}
        stops={state === 'empty' ? [] : stops} labels={language === 'de' ? german : undefined}
        loading={state === 'loading'} error={state === 'error' ? 'Journey information unavailable.' : undefined} onRetry={() => setState('ready')}
        status={delayed ? 'Running approximately 8 minutes late' : undefined} statusTone={delayed ? 'warning' : 'neutral'}
        onSelectStop={setSelected} selectedStopId={selected}
        note="Synthetic journey · Example calls and times, not a live service. Calling points follow the selected vehicle." />
    </div>
    <output className="airport-selection">Selected stop: {selected ?? 'none'}</output>
    <p className="note">Advance or rewind to move the next stop. Switch presentation to compare rail and bus treatments; times and destinations can be absent independently.</p>
  </>
}
