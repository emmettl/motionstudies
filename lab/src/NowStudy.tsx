import { useEffect, useMemo, useRef, useState } from 'react'
import { buildStationIndex, type NetworkSnapshot } from '@motionstudies/core/domain/network'
import { NationalNetworkScene, type MapCameraCommand } from '@motionstudies/three/NationalNetworkScene'
import { ATLAS_MAP_FRAMING } from '@motionstudies/three/map-camera'
import { useNowClock } from '@motionstudies/web/use-now-clock'
import { useBrowserLocation } from '@motionstudies/web/use-browser-location'
import { network } from './fixtures.ts'

const locationMessages = {
  idle: 'Location stays in this browser. It is only requested when you choose to share it.',
  locating: 'Finding your location…',
  ready: 'Location found.',
  denied: 'Location permission was declined. Now still works; you can enable location in browser settings and retry.',
  timeout: 'Location took too long. Try again.',
  unavailable: 'Location is unavailable in this browser. Now still works.',
}

export function NowStudy() {
  // A full-day synthetic timetable, centred on the current clock when mounted.
  const [fixture] = useState(() => {
    const instant = new Date()
    const midnight = Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate())
    const focus = (instant.getTime() - midnight) / 1000
    const trains = Array.from({ length: 360 }, (_, index) => network.trains.map((train) => {
      const offset = index * 240
      return { ...train, id: `${train.id}-${index}`, start: train.start + offset, end: train.end + offset,
        stops: train.stops.map(([stop, arrival, departure]) => [stop, arrival + offset, departure + offset] as const) }
    })).flat()
    const snapshot: NetworkSnapshot = { ...network, trains, metadata: { ...network.metadata,
      serviceDate: instant.toISOString().slice(0, 10), windowEnd: 86400, focusTime: focus } }
    return { snapshot, midnight, focus }
  })
  const [time, setTime] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(60)
  const [camera, setCamera] = useState<MapCameraCommand>()
  const cameraId = useRef(0)
  const clock = useNowClock((instant) => {
    const seconds = (instant.getTime() - fixture.midnight) / 1000
    return seconds >= 0 && seconds < 86400 ? seconds : null
  })
  const position = useBrowserLocation()
  const { location } = position
  const bounds = network.bounds
  const inside = location && location.longitude >= bounds.minLongitude && location.longitude <= bounds.maxLongitude &&
    location.latitude >= bounds.minLatitude && location.latitude <= bounds.maxLatitude
  const stations = useMemo(() => buildStationIndex(fixture.snapshot), [fixture])
  const displayedTime = (clock.active ? clock.time : time ?? clock.time) ?? fixture.focus
  useEffect(() => {
    if (!inside || !location) return
    setCamera({ id: ++cameraId.current, action: 'focus-location', focus: [location.longitude, location.latitude], distanceScale: 0.25 })
  }, [inside, location])

  const startNow = () => { setTime(null); setPlaying(false); setRate(1); clock.start() }
  return <>
    <div className="now-toolbar toolbar">
      <button className="now-button" aria-pressed={clock.active} data-tooltip="Go to the current time and follow the clock at 1×" onClick={startNow}><span aria-hidden="true" />Now</button>
      <button onClick={() => { clock.stop(); setPlaying(clock.active ? false : !playing) }}>{playing || clock.active ? 'Pause' : 'Play'}</button>
      <label>Speed <select aria-label="Playback speed" value={rate} onChange={(event) => { clock.stop(); setRate(Number(event.target.value)); setPlaying(true) }}>
        <option value="1">1× · Realtime</option><option value="60">60×</option><option value="240">240×</option>
      </select></label>
      <button disabled={position.status === 'locating'} onClick={position.locate}>Use my location</button>
      {(location || position.status === 'locating') && <button onClick={position.clear}>Clear location</button>}
    </div>
    <div className="now-readout"><output data-testid="now-time">{new Date(fixture.midnight + displayedTime * 1000).toISOString().slice(11, 19)}</output><span>{clock.active ? 'Now · 1×' : playing ? `Playback · ${rate}×` : 'Paused'} · UTC</span></div>
    <p className="note" role="status">{clock.unavailable ? 'The current time is outside this study’s recorded day. Reload this synthetic preview for a new day.' : 'Synthetic timetable · current clock, invented movements.'}</p>
    <div className="scene-preview"><NationalNetworkScene snapshot={fixture.snapshot} referenceSnapshot={fixture.snapshot}
      time={displayedTime} isPlaying={playing && !clock.active} playbackRate={rate} onTime={setTime}
      stations={stations} trainLabelMode="on" cameraFraming={ATLAS_MAP_FRAMING} cameraCommand={camera}
      userLocation={inside ? location : undefined} groundStyle="quiet" /></div>
    <div className="timeline"><label>Time <input aria-label="Now study time" type="range" min="0" max="86399" value={displayedTime}
      onChange={(event) => { clock.stop(); setPlaying(false); setTime(Number(event.target.value)) }} /></label></div>
    <p className="note" role="status">{location ? inside ? `Your location · accuracy approximately ${Math.round(location.accuracy)} m. The glowing dot marks the reported position.` : 'Your location is outside this synthetic map. The view stays here; no location dot is shown.' : locationMessages[position.status]}</p>
    <p className="note">The camera stays still while the clock follows the present. Pan and zoom to explore. This lab’s invented map lies near 0° latitude and longitude; location does not create local transport coverage.</p>
  </>
}
