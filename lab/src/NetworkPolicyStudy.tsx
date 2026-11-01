import { useMemo, useRef, useState } from 'react'
import { buildRouteIndex, buildStationIndex } from '@motionstudies/core/domain/network'
import { NationalNetworkScene, type MapCameraCommand } from '@motionstudies/three/NationalNetworkScene'
import { ATLAS_MAP_FRAMING } from '@motionstudies/three/map-camera'
import type { NetworkMapStyle } from '@motionstudies/three/scene-style'
import type { NetworkSceneExtensions } from '@motionstudies/three/scene-extensions'
import { branchingLayout, branchingNetwork, denseNetwork, policyBoundary, policyLakes } from './policy-fixtures.ts'
import { NetworkStyleProbe } from './NetworkStyleProbe.tsx'

export function NetworkPolicyStudy() {
  const [dense, setDense] = useState(false), [time, setTime] = useState(60), [mix, setMix] = useState(0), [playing, setPlaying] = useState(false)
  const [budget, setBudget] = useState(24), [height, setHeight] = useState(16), [offset, setOffset] = useState(20), [padding, setPadding] = useState(12), [radius, setRadius] = useState(12)
  const [coplanar, setCoplanar] = useState(false), [opacity, setOpacity] = useState(1), [portrait, setPortrait] = useState(false), [viewport, setViewport] = useState(false), [detail, setDetail] = useState(1), [morph, setMorph] = useState(false)
  const [selection, setSelection] = useState('none'), [camera, setCamera] = useState<MapCameraCommand>(), [mounted, setMounted] = useState(true)
  const command = useRef(0), source = dense ? denseNetwork : branchingNetwork
  const stations = useMemo(() => buildStationIndex(source), [source]), routes = useMemo(() => buildRouteIndex(source), [source])
  const style = useMemo<NetworkMapStyle>(() => ({ coplanar,
    trainLabels: { budget: () => budget, screenHeight: () => height, screenOffset: () => offset, viewportPadding: padding, avoidStationLabels: true },
    stationLabels: { rankLimit: () => Infinity, screenHeight: () => height, viewportPadding: padding },
    selectionMarkers: { stationMaxRadiusPixels: radius, trainMaxRadiusPixels: radius },
    materials: { groundGridOpacityScale: () => opacity, waterOpacityScale: () => opacity, borderOpacityScale: () => opacity, trafficFlowOverviewEmphasis: () => opacity },
  }), [coplanar, budget, height, offset, padding, radius, opacity])
  const framing = useMemo(() => ({ ...ATLAS_MAP_FRAMING, localDetailHierarchy: true, localDetailDistanceScale: detail }), [detail])
  const extensions = useMemo<NetworkSceneExtensions>(() => ({ spatialMorph: morph ? (x, z) => [x * .7 + Math.sin(z * .2) * 2, z * .65] : undefined, cameraViewport: viewport ? ({ spatialLayoutMix }) => ({ zoom: 1 + spatialLayoutMix * .3, offsetY: 35 }) : undefined }), [viewport, morph])
  const controls: [string, number, (value: number) => void, number, number, number][] = [
    ['Label budget', budget, setBudget, 0, 48, 1], ['Label height', height, setHeight, 10, 30, 1], ['Label offset', offset, setOffset, -40, 60, 1],
    ['Viewport padding', padding, setPadding, 0, 80, 1], ['Selection radius cap', radius, setRadius, 2, 30, 1], ['Material opacity', opacity, setOpacity, 0, 1, .1],
    ['Local detail scale', detail, setDetail, .2, 2, .1],
  ]
  return <>
    <div className="toolbar">
      <label><input type="checkbox" checked={dense} onChange={e => setDense(e.target.checked)} /> Dense traffic</label>
      <label><input type="checkbox" checked={coplanar} onChange={e => setCoplanar(e.target.checked)} /> Coplanar surfaces</label>
      <label><input type="checkbox" checked={portrait} onChange={e => setPortrait(e.target.checked)} /> Portrait canvas</label>
      <label><input type="checkbox" checked={morph} onChange={e => setMorph(e.target.checked)} /> Topology-preserving morph</label>
      <label><input type="checkbox" checked={viewport} onChange={e => setViewport(e.target.checked)} /> Authored viewport</label>
      <label>Selection <select aria-label="Policy selection" value={selection} onChange={e => setSelection(e.target.value)}>{['none', 'route', 'station', 'service', 'comparison'].map(v => <option key={v}>{v}</option>)}</select></label>
      <button onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
      {(['zoom-in', 'zoom-out', 'reset', 'focus-location'] as const).map(action => <button key={action} onClick={() => setCamera({ id: ++command.current, action, focus: [.14, .13], distanceScale: .12 })}>{action}</button>)}
      <button onClick={() => setMounted(!mounted)}>{mounted ? 'Unmount policies' : 'Mount policies'}</button>
    </div>
    <div className="policy-controls">{controls.map(([label, value, setter, min, max, step]) => <label key={label}>{label} <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => setter(+e.target.value)} /><output>{value}</output></label>)}</div>
    <div className="scene-preview policy-scene" style={{ width: portrait ? 320 : '100%', maxWidth: '100%', height: 520 }}>
      {mounted && <NationalNetworkScene snapshot={source} referenceSnapshot={source} stations={stations} spatialLayout={morph ? undefined : branchingLayout} spatialLayoutMix={mix}
        isPlaying={playing} time={time} onTime={setTime} playbackRate={4} trainLabelMode="on" cameraFraming={framing} cameraCommand={camera}
        mapStyle={style} extensions={extensions} boundary={policyBoundary} lakes={policyLakes}
        selectedTrain={selection === 'service' ? source.trains[0] : undefined} selectedRoute={selection === 'route' ? routes[0] : undefined}
        selectedStation={selection === 'station' ? stations.find(s => s.name === 'Junction') ?? stations[1] : undefined}
        comparisonTrains={selection === 'comparison' ? source.trains.slice(0, 3) : undefined}>
        <NetworkStyleProbe />
      </NationalNetworkScene>}
    </div>
    <div className="timeline"><label>Time <input aria-label="Policy time" type="range" min="0" max="240" value={time} onChange={e => setTime(+e.target.value)} /></label><output data-testid="policy-time">{Math.round(time)} s</output></div>
    <div className="timeline"><label>Geography → diagram <input aria-label="Policy layout mix" type="range" min="0" max="1" step=".01" value={mix} onChange={e => setMix(+e.target.value)} /></label><output>{Math.round(mix * 100)}%</output></div>
    <p className="note">Invented branching routes with intermediate bends and a local bus. Pause and change policies to inspect invalidation. Scrub through the junction dwell at 110–130 s while morphing; vehicles should follow the same route geometry. Dense traffic introduces 48 overlapping services. Topology-preserving morph uses a continuous warp of the source geometry instead of the authored diagram. Focus the junction to inspect selection caps and local detail. Authored viewport varies zoom with layout mix; disabling it restores default projection.</p>
  </>
}
