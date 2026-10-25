import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useThree } from '@react-three/fiber'
import { Points, type Camera, type Scene } from 'three'
import { scenePickMetadata } from '@motionstudies/three/scene-picking'
import { NationalNetworkScene } from '@motionstudies/three/NationalNetworkScene'
import { useNetworkScene, type NetworkSceneExtensions } from '@motionstudies/three/scene-extensions'
import type { SpatialMorphProjection } from '@motionstudies/three/spatial-morph'
import { buildStationIndex } from '@motionstudies/core/domain/network'
import { network, layout } from '../../lab/src/fixtures.ts'

const metadata = {source:'fixture',sourceUrl:'https://example.test',productUrl:'',edition:'test',attribution:'test',sourceCrs:'WGS84',outputCrs:'WGS84',simplificationToleranceMetres:0}
const ring = [[0.08,0.04],[0.12,0.04],[0.12,0.07],[0.08,0.07],[0.08,0.04]] as const
const lakes = {metadata:{...metadata,minimumAreaSquareKilometres:0},lakes:[{id:'lake',name:'Lake',areaSquareKilometres:1,polygons:[[ring]]}]}
const boundary = {metadata,rings:[ring]}
const probe = {
  positions: 0, starts: 0, disposals: 0, childMounts: 0, childDisposals: 0,
  stop: [] as number[], camera: undefined as Camera | undefined, scene: undefined as Scene | undefined,
}
Object.assign(globalThis, { rendererExtensionProbe: probe, contextRailProbe: () => {
  let pickable=0, decorative=0
  probe.scene?.traverse(object=>{if(object instanceof Points && object.renderOrder===0 && object.geometry.getAttribute('position')?.count){
    if(scenePickMetadata(object.geometry)?.stopIndexes)pickable++;else decorative++
  }})
  return {pickable,decorative}
} })

const createCameraDriver: NonNullable<NetworkSceneExtensions['createCameraDriver']> = ({ camera }) => {
  probe.starts++
  return { update() { camera.position.set(7, 25, 18); return true }, dispose() { probe.disposals++ } }
}

const morphA: SpatialMorphProjection = (x, z) => [x + 20, z - 5]
const morphB: SpatialMorphProjection = (x, z) => [x - 10, z + 8]

function Layer() {
  const { projectedStops } = useNetworkScene()
  const { camera, scene } = useThree()
  useEffect(() => {
    probe.camera = camera; probe.scene = scene; probe.childMounts++
    return () => { probe.childDisposals++ }
  }, [camera, scene])
  useEffect(() => { probe.stop = [...projectedStops[0]] }, [projectedStops])
  return <mesh name="edition-layer" position={projectedStops[0]}><sphereGeometry args={[0.3]} /><meshBasicMaterial color="#fff" /></mesh>
}
export function ExtensionFixture() {
  const [position, setPosition] = useState<'default' | 'custom' | 'hidden'>('default')
  const [context, setContext] = useState(false)
  const [coplanar, setCoplanar] = useState(false)
  const [driver, setDriver] = useState(false)
  const [mounted, setMounted] = useState(true)
  const [mix, setMix] = useState(0)
  const [morph, setMorph] = useState('off')
  const extensions = useMemo<NetworkSceneExtensions>(() => ({
    spatialMorph: morph === 'a' ? morphA : morph === 'b' ? morphB : undefined,
    trainPosition: (_train, _time, _stops) => {
      probe.positions++
      return position === 'custom' ? [7, 0.2, 4] : position === 'hidden' ? null : undefined
    },
    createCameraDriver: driver ? createCameraDriver : undefined,
  }), [position, driver, morph])
  return <>
    <select aria-label="Position" value={position} onChange={event => setPosition(event.target.value as typeof position)}>
      <option value="default">Default</option><option value="custom">Custom</option><option value="hidden">Hidden</option>
    </select>
    <select aria-label="Morph" value={morph} onChange={event => setMorph(event.target.value)}>
      <option value="off">Off</option><option value="a">A</option><option value="b">B</option>
    </select>
    <input aria-label="Layout mix" type="range" min="0" max="1" step="0.1" value={mix} onChange={event => setMix(Number(event.target.value))} />
    <button onClick={() => setContext(value => !value)}>Toggle context</button>
    <button onClick={() => setCoplanar(value => !value)}>Toggle plane</button>
    <button onClick={() => setDriver(value => !value)}>Toggle driver</button>
    <button onClick={() => setMix(value => 1 - value)}>Toggle layout</button>
    <button onClick={() => setMounted(value => !value)}>Toggle scene</button>
    <div style={{ height: 400 }}>
      {mounted && <NationalNetworkScene mapStyle={{coplanar}} lakes={lakes} boundary={boundary} snapshot={network} referenceSnapshot={network} contextSnapshot={context ? network : undefined}
        stations={buildStationIndex(network)} isPlaying={false} time={60} onTime={() => {}}
        playbackRate={1} trainLabelMode="off" cameraFraming={{ homeDistanceScale: 1, minimumDistanceScale: 0.1 }} spatialLayout={layout} spatialLayoutMix={mix}
        extensions={extensions}><Layer /></NationalNetworkScene>}
    </div>
  </>
}
createRoot(document.getElementById('root')!).render(<ExtensionFixture />)
