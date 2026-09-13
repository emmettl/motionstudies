import { infrastructureExtensions, infrastructureStyle, inactiveNetwork, specimenAirports, specimenRoads } from './infrastructure-specimen.ts'
import { FLAT_NETWORK_MAP_STYLE } from '@motionstudies/three/scene-style'
import { NetworkStyleProbe } from './NetworkStyleProbe.tsx'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { buildRouteIndex, buildStationIndex, type StationIndexEntry } from '@motionstudies/core/domain/network'
import { callsAtHub } from '@motionstudies/core/domain/hub'
import { NationalNetworkScene, type MapCameraCommand } from '@motionstudies/three/NationalNetworkScene'
import { HubPulseScene } from '@motionstudies/three/HubPulseScene'
import { StationFlowScene } from '@motionstudies/three/StationFlowScene'
import { ATLAS_MAP_FRAMING } from '@motionstudies/three/map-camera'
import { MobilePicker } from '@motionstudies/web/components/MobilePicker'
import { applyVisualTheme } from '@motionstudies/web/visual-theme'
import { createDataUrlResolver } from '@motionstudies/web/data-url'
import { useProgressiveNetworkDay } from '@motionstudies/web/use-progressive-network-day'
import { useObservedOperations } from '@motionstudies/web/use-observed-operations'
import { air, emptyNetwork, layout, network, road, themes } from './fixtures.ts'
import { AirportStudy } from './AirportStudy.tsx'
import { NowStudy } from './NowStudy.tsx'
import { BusBoardStudy } from './BusBoardStudy.tsx'
import { TransportHeroStudy } from './TransportHeroStudy.tsx'
import { VehicleHeroStudy } from './VehicleHeroStudy.tsx'

const sections = ['Controls', 'Network', 'Hub', 'Airports', 'Data', 'Now', 'Bus boards', 'Transport heroes', 'Vehicle heroes'] as const
const hub = { id: 'junction', name: 'Junction', displayName: 'Junction', character: 'Synthetic interchange' }
const calls = callsAtHub(network, hub)
const dataUrl = createDataUrlResolver(`${import.meta.env.BASE_URL}data/`)

function ThemePanel({ theme, children }: { theme: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => { if (root.current) applyVisualTheme(themes[theme], root.current) }, [theme])
  return <div ref={root} className="theme-panel">{children}</div>
}

function ControlStudy() {
  const [value, setValue] = useState('local')
  const [labels, setLabels] = useState(false)
  const [long, setLong] = useState(false)
  const [up, setUp] = useState(false)
  const options = [{ value: 'local', label: 'Local', detail: 'Calls at every stop' },
    { value: 'express', label: long ? 'An unusually long service label' : 'Express', detail: 'A shorter stopping pattern' }]
  return <>
    <div className="toolbar"><label><input type="checkbox" checked={long} onChange={(e) => setLong(e.target.checked)} /> Long labels</label><label><input type="checkbox" checked={up} onChange={(e) => setUp(e.target.checked)} /> Open upwards</label></div>
    <div className="toolbar" aria-label="Tooltip specimens">
      <button aria-label="Vehicle labels" aria-describedby="tooltip-note" data-tooltip={labels ? 'Hide vehicle labels on the map' : 'Show vehicle labels on the map'} onClick={() => setLabels(!labels)}>L·{labels ? 'A' : '0'}</button>
      <button disabled data-tooltip="Reset is unavailable until a scene is mounted">↺</button>
      <button data-tooltip="" onClick={() => setLabels(false)}>Clear</button>
      <span id="tooltip-note">Hover or use Tab for help. Escape dismisses the hint. Touch controls stay clear.</span>
    </div>
    <div className="theme-grid">{Object.keys(themes).map((theme) => <ThemePanel key={theme} theme={theme}>
      <span className="specimen-label">{theme} theme</span>
      <MobilePicker ariaLabel={`${theme} service`} options={options} value={value} onChange={setValue} menuPlacement={up ? 'up' : 'down'} />
      <MobilePicker ariaLabel={`${theme} empty`} options={[]} value="" onChange={() => {}} triggerLabel="No services" />
      <output>Selected: {value}</output>
    </ThemePanel>)}</div>
    <p className="note">Both pickers share selection. Theme changes stay inside each specimen. Tab, arrow keys and Escape work independently.</p>
  </>
}

function RenderingStudy({ kind }: { kind: 'Network' | 'Hub' }) {
  const [time, setTime] = useState(60)
  const [playing, setPlaying] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [diagram, setDiagram] = useState(0)
  const [compare, setCompare] = useState(false)
  const [layers, setLayers] = useState(false)
  const [flat,setFlat]=useState(false)
  const [infrastructure, setInfrastructure] = useState(false)
  const [palette, setPalette] = useState(false)
  const mapStyle = useMemo(() => ({ ...(flat ? FLAT_NETWORK_MAP_STYLE : {}), ...(infrastructure ? infrastructureStyle : {}), categoryColors: palette ? { regional: '#ff3366', intercity: '#ff3366', metro: '#ff3366', bus: '#ffcc00', other: '#ff3366' } : undefined }), [flat, palette, infrastructure])
  const [mounted, setMounted] = useState(true)
  const [selection, setSelection] = useState('none')
  const [station, setStation] = useState<StationIndexEntry>()
  const [camera, setCamera] = useState<MapCameraCommand>()
  const source = empty ? infrastructure ? inactiveNetwork : emptyNetwork : network
  const stations = useMemo(() => buildStationIndex(source), [source])
  const cameraId = useRef(0)
  const scene = (secondary = false) => <NationalNetworkScene snapshot={source} referenceSnapshot={network}
    infrastructureSnapshot={infrastructure ? network : undefined} extensions={infrastructure ? infrastructureExtensions : undefined}
    airports={infrastructure ? specimenAirports : undefined} roadTopology={infrastructure ? specimenRoads : undefined}
    isPlaying={playing && !secondary} time={time} onTime={setTime} playbackRate={4}
    stations={stations} trainLabelMode="on" cameraFraming={ATLAS_MAP_FRAMING} cameraCommand={camera}
    selectedRoute={!empty && selection === 'route' ? buildRouteIndex(network)[0] : undefined}
    selectedTrain={!empty && selection === 'service' ? network.trains[0] : undefined}
    selectedStation={!empty && selection === 'station' ? station ?? stations[1] : undefined}
    onSelectStation={(next) => { setStation(next); setSelection('station') }}
    mapStyle={mapStyle} groundStyle={flat?'quiet':'grid'} topologicalStyle={flat?'line-map':'luminous'} routeColors={flat?{'1':'#ffb36b','2':'#82e5c5'}:undefined} routeColorMix={flat?1:0}
    spatialLayout={layout} spatialLayoutMix={secondary ? 1 - diagram : diagram}
    airSnapshot={layers ? air : undefined} roadSnapshot={layers ? road : undefined}><NetworkStyleProbe /></NationalNetworkScene>
  return <>
    <div className="toolbar">
      <button onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
      <button data-tooltip={mounted ? 'Remove the scene to exercise cleanup; keep the control settings' : 'Mount the scene again with the current settings'} onClick={() => setMounted(!mounted)}>{mounted ? 'Unmount' : 'Mount'}</button>
      <label><input type="checkbox" checked={empty} onChange={(e) => setEmpty(e.target.checked)} /> Empty data</label>
      <label><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> {kind === 'Hub' ? 'Track view' : 'Linked views'}</label>
      {kind === 'Network' && <><label><input type="checkbox" checked={flat} onChange={e=>setFlat(e.target.checked)}/> Flat routes + quiet ground</label><label><input type="checkbox" checked={layers} onChange={(e) => setLayers(e.target.checked)} /> Air + road</label>
        <label><input type="checkbox" checked={infrastructure} onChange={e => setInfrastructure(e.target.checked)} /> Infrastructure interfaces</label>
        <label><input type="checkbox" checked={palette} onChange={e => setPalette(e.target.checked)} /> Alternate category palette</label>
        <label>Selection <select value={selection} onChange={(e) => setSelection(e.target.value)}><option value="none">None</option><option value="route">Route</option><option value="service">Service</option><option value="station">Station</option></select></label>
        {(['zoom-in', 'zoom-out', 'reset'] as const).map((action) => <button key={action} data-tooltip={action === 'reset' ? 'Restore the opening camera position' : action === 'zoom-in' ? 'Move closer to the network' : 'Show more of the network'} onClick={() => setCamera({ id: ++cameraId.current, action })}>{action}</button>)}
      </>}
    </div>
    <div className={`scene-grid${compare && kind === 'Network' ? ' is-paired' : ''}`} data-testid="scene-preview">
      {!mounted ? <div className="unmounted">Scene unmounted. Controls retain their state.</div> : kind === 'Network' ? <><div className="scene-preview">{scene()}</div>{compare && <div className="scene-preview">{scene(true)}</div>}</> :
        <div className="scene-preview">{compare ? <StationFlowScene platformPrefix="Platform" timeline={network.metadata} hub={hub} calls={empty ? [] : calls} isPlaying={playing} time={time} onTime={setTime} playbackRate={4} /> :
          <HubPulseScene timeline={network.metadata} hub={hub} calls={empty ? [] : calls} isPlaying={playing} time={time} onTime={setTime} playbackRate={4} showTaktOverlay />}</div>}
    </div>
    <div className="timeline"><label>Time <input aria-label="Study time" type="range" min="0" max="240" value={time} onChange={(e) => setTime(Number(e.target.value))} /></label><output data-testid="study-time">{Math.round(time)} s</output></div>
    {kind === 'Network' && <div className="timeline"><label>Geography → diagram <input aria-label="Layout mix" type="range" min="0" max="1" step="0.01" value={diagram} onChange={(e) => setDiagram(Number(e.target.value))} /></label><output>{Math.round(diagram * 100)}%</output></div>}
    <p className="note">Invented stops and movements. Playback, selection and camera commands belong to this consumer.</p>
  </>
}

function DataStudy() {
  const [enabled, setEnabled] = useState(false)
  const [file, setFile] = useState('day-a.json')
  const [time, setTime] = useState(60)
  const [observing, setObserving] = useState(false)
  const [endpoint, setEndpoint] = useState('observations-a.json')
  const state = useProgressiveNetworkDay(file, enabled, time, dataUrl)
  const observed = useObservedOperations(dataUrl(endpoint), observing, 1000)
  return <>
    <div className="toolbar"><button data-tooltip={enabled ? 'Cancel pending requests and clear the loaded study' : 'Load the manifest and the chunks around the selected time'} onClick={() => setEnabled(!enabled)}>{enabled ? 'Disable loader' : 'Enable loader'}</button>
      <label>Dataset <select value={file} onChange={(e) => setFile(e.target.value)}><option value="day-a.json">Day A</option><option value="day-b.json">Day B</option><option value="empty.json">Empty manifest</option><option value="invalid.json">Invalid response</option><option value="bad-digest.json">Failed integrity</option></select></label>
      <label>Time <input type="range" min="0" max="240" value={time} onChange={(e) => setTime(Number(e.target.value))} /></label></div>
    <div className="readout" role="status" data-testid="data-status"><span>{!enabled ? 'Disabled' : state.error ? 'Error' : state.loading ? 'Loading' : 'Ready'}</span>
      <pre>{JSON.stringify({ source: state.manifest?.metadata.feedVersion, ready: state.chunkReady, journeys: state.network?.trains.length ?? 0, time }, null, 2)}</pre></div>
    <div className="toolbar"><button data-tooltip={observing ? 'Stop refreshing the observation fixture' : 'Refresh the observation fixture every second'} onClick={() => setObserving(!observing)}>{observing ? 'Stop polling' : 'Start polling'}</button>
      <label>Observation source <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)}><option value="observations-a.json">Source A</option><option value="observations-b.json">Source B</option><option value="invalid.json">Invalid response</option></select></label></div>
    <div className="readout" role="status"><span>{observed.loading ? 'Loading observations' : observed.error ? 'Observation error' : 'Observations'}</span><pre>{JSON.stringify({ publisher: observed.snapshot?.metadata.publisher, vehicles: observed.snapshot?.vehicles.length ?? 0 }, null, 2)}</pre></div>
    <p className="note">Small local fixtures. The browser suite also exercises delayed responses, failures, cancellation and recovery.</p>
  </>
}

export function App() {
  const [section, setSection] = useState<(typeof sections)[number]>('Controls')
  return <div className="lab"><aside className="lab-sidebar"><a className="lab-wordmark" href="./">Motion<br />Studies <span>Lab</span></a><nav aria-label="Specimens">{sections.map((name, index) => <button key={name} aria-current={section === name ? 'page' : undefined} onClick={() => setSection(name)}><small>0{index + 1}</small>{name}</button>)}</nav><p>Shared instrument<br /><span>Synthetic fixtures · v0</span></p></aside>
    <main className="lab-main"><header><div><p className="kicker">Package specimens</p><h1>{section}</h1></div><span className="lab-badge">Interactive</span></header>
      {section === 'Controls' ? <ControlStudy /> : section === 'Airports' ? <AirportStudy /> : section === 'Data' ? <DataStudy /> : section === 'Now' ? <NowStudy /> : section === 'Bus boards' ? <BusBoardStudy /> : section === 'Transport heroes' ? <TransportHeroStudy /> : section === 'Vehicle heroes' ? <VehicleHeroStudy /> : <RenderingStudy key={section} kind={section} />}
    </main></div>
}
